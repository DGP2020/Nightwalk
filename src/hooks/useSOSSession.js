import { useState, useEffect, useRef, useCallback } from 'react';
import { collection, doc, setDoc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useLiveLocation } from './useLiveLocation';

/**
 * Manages the full SOS session lifecycle:
 * 1. Creates a Firestore document when SOS activates
 * 2. Streams location updates into Firestore in real time
 * 3. Generates a shareable beacon URL
 * 4. Ends the session cleanly when the user taps "I'm Safe"
 */
export const useSOSSession = (isActive) => {
  const [sessionId, setSessionId] = useState(null);
  const [beaconUrl, setBeaconUrl] = useState(null);
  const [firestoreError, setFirestoreError] = useState(null);
  const sessionDocRef = useRef(null);

  const { location, error: locationError } = useLiveLocation(isActive);

  const lastPushTimeRef = useRef(0);

  // --- Step 1: Create the Firestore session when SOS activates ---
  useEffect(() => {
    if (!isActive) return;

    const startSession = async () => {
      if (!db) {
        // Firebase not configured — generate a collision-resistant demo ID
        const randomSuffix = typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID().slice(0, 8)
          : Math.random().toString(36).substring(2, 10);
        const demoId = `demo-${randomSuffix}`;
        setSessionId(demoId);
        setBeaconUrl(`${window.location.origin}${window.location.pathname}?beacon=${demoId}`);
        console.warn('⚠️ Firestore not available — running in demo mode. Beacon URL is local-only.');
        return;
      }

      try {
        const newDocRef = doc(collection(db, 'sos_sessions'));
        await setDoc(newDocRef, {
          active: true,
          startedAt: serverTimestamp(),
          coords: [],
        });

        sessionDocRef.current = newDocRef;
        setSessionId(newDocRef.id);
        setBeaconUrl(`${window.location.origin}${window.location.pathname}?beacon=${newDocRef.id}`);
        console.log('✅ SOS session created:', newDocRef.id);
      } catch (err) {
        console.error('Failed to create SOS session in Firestore:', err);
        setFirestoreError(err.message);
      }
    };

    startSession();
  }, [isActive]);

  // --- Step 2: Push location updates to Firestore whenever location changes (paced at ~1.5s) ---
  useEffect(() => {
    if (!isActive || !location || !sessionDocRef.current || !db) return;

    // Coordinate sanity check
    if (
      typeof location.lat !== 'number' ||
      typeof location.lng !== 'number' ||
      location.lat < -90 ||
      location.lat > 90 ||
      location.lng < -180 ||
      location.lng > 180
    ) {
      return;
    }

    const now = Date.now();
    // Gentle 1.5s pace to prevent Firestore single-document write contention while keeping UI live
    if (now - lastPushTimeRef.current < 1500) return;

    const pushLocation = async () => {
      try {
        lastPushTimeRef.current = now;
        const normalizedCoord = {
          lat: Number(location.lat.toFixed(6)),
          lng: Number(location.lng.toFixed(6)),
          accuracy: Math.round(location.accuracy || 0),
          t: location.timestamp || now,
        };

        await updateDoc(sessionDocRef.current, {
          coords: arrayUnion(normalizedCoord),
          // Keep the latest coord at the top level for fast BeaconView reads
          lastCoord: {
            lat: normalizedCoord.lat,
            lng: normalizedCoord.lng,
            accuracy: normalizedCoord.accuracy,
          },
          lastUpdated: serverTimestamp(),
        });
      } catch (err) {
        console.error('Failed to push location to Firestore:', err);
      }
    };

    pushLocation();
  }, [location, isActive]);

  // --- Step 3: End the session ---
  const endSession = useCallback(async () => {
    if (!sessionDocRef.current || !db) return;

    try {
      await updateDoc(sessionDocRef.current, {
        active: false,
        endedAt: serverTimestamp(),
      });
      console.log('✅ SOS session ended.');
    } catch (err) {
      console.error('Failed to end SOS session:', err);
    } finally {
      sessionDocRef.current = null;
      setSessionId(null);
      setBeaconUrl(null);
    }
  }, []);

  return {
    sessionId,
    beaconUrl,
    location,
    locationError,
    firestoreError,
    endSession,
  };
};
