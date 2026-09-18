import React, { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

/**
 * BeaconView — what a guardian sees when they open the shared tracking link.
 * Subscribes to the Firestore SOS session via onSnapshot for real-time updates.
 */
const BeaconView = ({ sessionId }) => {
  const [sessionData, setSessionData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) return;

    if (!db) {
      setError('Firebase is not configured. Cannot load live tracking data.');
      setLoading(false);
      return;
    }

    const sessionRef = doc(db, 'sos_sessions', sessionId);

    // Real-time listener — fires every time Firestore document updates
    const unsubscribe = onSnapshot(
      sessionRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setSessionData(snapshot.data());
        } else {
          setError('Tracking session not found or has expired.');
        }
        setLoading(false);
      },
      (err) => {
        console.error('Firestore listener error:', err);
        setError('Failed to connect to live tracking. Check your network.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [sessionId]);

  const position = sessionData?.lastCoord
    ? [sessionData.lastCoord.lat, sessionData.lastCoord.lng]
    : null;

  // --- Loading state ---
  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-900 text-white flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-lg font-semibold">Connecting to live tracking...</p>
        <p className="text-sm text-gray-400">Session: {sessionId}</p>
      </div>
    );
  }

  // --- Error state ---
  if (error) {
    return (
      <div className="fixed inset-0 bg-gray-900 text-white flex flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="text-6xl">❌</div>
        <h1 className="text-2xl font-bold">Tracking Unavailable</h1>
        <p className="text-gray-400">{error}</p>
      </div>
    );
  }

  // --- Session ended state ---
  if (sessionData && !sessionData.active) {
    return (
      <div className="fixed inset-0 bg-gray-900 text-white flex flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="text-6xl">✅</div>
        <h1 className="text-2xl font-bold">They're Safe</h1>
        <p className="text-gray-400">The SOS session has ended. No further tracking needed.</p>
      </div>
    );
  }

  // --- Live tracking state ---
  return (
    <div className="fixed inset-0 flex flex-col bg-gray-900">
      {/* Header */}
      <div className="bg-red-600 text-white px-4 py-3 flex items-center gap-3 z-10">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
        </span>
        <div>
          <p className="font-bold text-sm">🚨 LIVE SOS TRACKING</p>
          {position && (
            <p className="text-xs opacity-80">
              {position[0].toFixed(5)}, {position[1].toFixed(5)}
            </p>
          )}
        </div>
      </div>

      {/* Map */}
      {position ? (
        <MapContainer
          center={position}
          zoom={16}
          className="flex-grow"
          key={position.join(',')} // re-center when position changes significantly
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={position} icon={redIcon}>
            <Popup>📍 Live location</Popup>
          </Marker>
        </MapContainer>
      ) : (
        <div className="flex-grow flex items-center justify-center text-white">
          <p className="text-gray-400">Waiting for GPS signal...</p>
        </div>
      )}
    </div>
  );
};

export default BeaconView;
