import { useState, useEffect, useRef, useCallback } from 'react';
import { collection, doc, setDoc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useLiveLocation } from './useLiveLocation';
import { saveIncident } from '../utils/incidentLog';

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
  // Track metadata for the incident log
  const startedAtRef = useRef(null);
  const coordCountRef = useRef(0);
  const lastCoordRef = useRef(null);
  const beaconUrlRef = useRef(null);
  const sessionIdRef = useRef(null);

  const { location, error: locationError } = useLiveLocation(isActive);

  // --- Step 1: Create the Firestore session when SOS activates ---
  useEffect(() => {
    if (!isActive) return;

    const startSession = async () => {
      if (!db) {
        // Firebase not configured — generate a dummy ID for offline demo mode
        const demoId = `demo-${Date.now()}`;
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
        startedAtRef.current = Date.now();
        coordCountRef.current = 0;
        const url = `${window.location.origin}${window.location.pathname}?beacon=${newDocRef.id}`;
        beaconUrlRef.current = url;
        sessionIdRef.current = newDocRef.id;
        setSessionId(newDocRef.id);
        setBeaconUrl(url);
        console.log('✅ SOS session created:', newDocRef.id);
      } catch (err) {
        console.error('Failed to create SOS session in Firestore:', err);
        setFirestoreError(err.message);
      }
    };

    startSession();
  }, [isActive]);

  // --- Step 2: Push location updates to Firestore whenever location changes ---
  useEffect(() => {
    if (!isActive || !location || !sessionDocRef.current || !db) return;

    const pushLocation = async () => {
      try {
        await updateDoc(sessionDocRef.current, {
          coords: arrayUnion({
            lat: location.lat,
            lng: location.lng,
            accuracy: location.accuracy,
            t: location.timestamp,
          }),
          // Keep the latest coord at the top level for fast BeaconView reads
          lastCoord: { lat: location.lat, lng: location.lng },
          lastUpdated: serverTimestamp(),
        });
        coordCountRef.current += 1;
        lastCoordRef.current = { lat: location.lat, lng: location.lng };
      } catch (err) {
        console.error('Failed to push location to Firestore:', err);
      }
    };

    pushLocation();
  }, [location, isActive]);

  // --- Step 3: End the session ---
  const endSession = useCallback(async () => {
    const endedAt = Date.now();
    const startedAt = startedAtRef.current || endedAt;
    const durationSeconds = Math.round((endedAt - startedAt) / 1000);

    // Save to local incident log regardless of Firestore status
    if (startedAtRef.current) {
      saveIncident({
        id: sessionIdRef.current || `local-${startedAt}`,
        startedAt,
        endedAt,
        durationSeconds,
        coordCount: coordCountRef.current,
        lastCoord: lastCoordRef.current,
        beaconUrl: beaconUrlRef.current,
      });
    }

    if (!sessionDocRef.current || !db) {
      // Reset refs
      startedAtRef.current = null;
      coordCountRef.current = 0;
      lastCoordRef.current = null;
      beaconUrlRef.current = null;
      sessionIdRef.current = null;
      setSessionId(null);
      setBeaconUrl(null);
      return;
    }

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
      startedAtRef.current = null;
      coordCountRef.current = 0;
      lastCoordRef.current = null;
      beaconUrlRef.current = null;
      sessionIdRef.current = null;
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
