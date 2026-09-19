import React, { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { Phone } from 'lucide-react';
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

/** Smoothly re-centres the map whenever position changes â€” no full remount. */
const MapUpdater = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView(position, map.getZoom());
  }, [position, map]);
  return null;
};

/**
 * BeaconView â€” what a guardian sees when they open the shared tracking link.
 * Subscribes to the Firestore SOS session via onSnapshot for real-time updates.
 * Enhanced: polyline trail, elapsed-time ticker, CARTO dark tiles, "Call Them" button.
 */
const BeaconView = ({ sessionId }) => {
  const [sessionData, setSessionData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [elapsedTime, setElapsedTime] = useState('0m');

  useEffect(() => {
    if (!sessionId) return;
    if (!db) {
      setError('Firebase is not configured. Cannot load live tracking data.');
      setLoading(false);
      return;
    }

    const sessionRef = doc(db, 'sos_sessions', sessionId);
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

  // Elapsed-time ticker â€” refreshes every 10s
  useEffect(() => {
    let interval;
    if (sessionData?.startedAt) {
      const updateElapsed = () => {
        const start = sessionData.startedAt.toDate
          ? sessionData.startedAt.toDate()
          : new Date(sessionData.startedAt);
        const diffInSeconds = Math.floor((new Date() - start) / 1000);
        if (diffInSeconds < 60) {
          setElapsedTime(`${diffInSeconds}s`);
        } else {
          setElapsedTime(`${Math.floor(diffInSeconds / 60)}m`);
        }
      };
      updateElapsed();
      interval = setInterval(updateElapsed, 10000);
    }
    return () => clearInterval(interval);
  }, [sessionData?.startedAt]);

  const position = sessionData?.lastCoord
    ? [sessionData.lastCoord.lat, sessionData.lastCoord.lng]
    : null;

  // Build polyline from all recorded coords
  const polylinePositions = (sessionData?.coords || [])
    .filter(c => c && c.lat && c.lng)
    .map(c => [c.lat, c.lng]);

  // --- Loading state ---
  if (loading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-gray-900 to-slate-900 text-white flex flex-col items-center justify-center gap-6">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin absolute" />
          <div className="w-10 h-10 border-4 border-red-400 border-b-transparent rounded-full animate-spin absolute" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
        </div>
        <div className="text-center">
          <p className="text-xl font-bold tracking-wider">CONNECTING</p>
          <p className="text-sm text-gray-400 mt-2">Loading live tracking session...</p>
        </div>
        <p className="text-xs text-gray-600 uppercase mt-4">Session: {sessionId}</p>
      </div>
    );
  }

  // --- Error state ---
  if (error) {
    return (
      <div className="fixed inset-0 bg-gray-900 text-white flex flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="text-6xl mb-4">❌</div>
        <h1 className="text-2xl font-bold text-red-500">Tracking Unavailable</h1>
        <p className="text-gray-400 max-w-md">{error}</p>
      </div>
    );
  }

  // --- Session ended state ---
  if (sessionData && !sessionData.active) {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-gray-900 to-emerald-950 text-white flex flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
          <div className="text-6xl">✅</div>
        </div>
        <h1 className="text-3xl font-bold text-emerald-400">They're Safe</h1>
        <p className="text-emerald-100/70 text-lg max-w-md">
          The SOS session has ended successfully. No further tracking is needed.
        </p>
      </div>
    );
  }

  // Check if signal has updated in the last 45 seconds
  const lastUpdateDate = sessionData?.lastUpdated?.toDate
    ? sessionData.lastUpdated.toDate()
    : sessionData?.lastUpdated
    ? new Date(sessionData.lastUpdated)
    : null;
  const isSignalLive = !lastUpdateDate || (Date.now() - lastUpdateDate.getTime() < 45000);

  // --- Live tracking state ---
  return (
    <div className="fixed inset-0 flex flex-col bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-700 to-red-600 text-white px-4 py-3 flex items-center justify-between shadow-md z-[1000]">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
          </span>
          <div>
            <p className="font-bold text-sm tracking-wide">🚨 LIVE SOS TRACKING</p>
            {position && (
              <p className="text-xs text-red-200 font-mono">
                {position[0].toFixed(5)}, {position[1].toFixed(5)}
              </p>
            )}
          </div>
        </div>
        {/* Call Emergency Police 112 button */}
        <a
          href="tel:112"
          aria-label="Call National Emergency Hotline 112"
          className="flex items-center gap-2 bg-white/20 hover:bg-white/30 transition-colors px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider"
        >
          <Phone size={15} />
          Call Police (112)
        </a>
      </div>

      {/* Map */}
      <div className="flex-grow relative z-0">
        {position ? (
          <MapContainer
            center={position}
            zoom={16}
            className="w-full h-full z-0"
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            {/* Movement trail polyline */}
            {polylinePositions.length > 0 && (
              <Polyline
                positions={polylinePositions}
                color="#ef4444"
                weight={3}
                opacity={0.7}
              />
            )}
            <Marker position={position} icon={redIcon}>
              <Popup>📍 Current GPS location</Popup>
            </Marker>
            <MapUpdater position={position} />
          </MapContainer>
        ) : (
          <div className="flex-grow flex items-center justify-center text-white h-full bg-gray-900">
            <p className="text-gray-400 flex items-center gap-2">
              <span className="animate-pulse">📡</span> Waiting for GPS signal...
            </p>
          </div>
        )}

        {/* Floating stats footer */}
        <div className="absolute bottom-4 left-4 right-4 bg-gray-900/90 backdrop-blur-sm rounded-2xl p-4 z-[1000] border border-gray-800 shadow-xl flex justify-between items-center pointer-events-none">
          <div className="flex flex-col">
            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Signal</span>
            <span className="text-white font-medium flex items-center gap-1.5 text-xs">
              <span className={`size-2 rounded-full ${isSignalLive ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
              {isSignalLive ? 'LIVE' : 'WAITING'}
            </span>
          </div>
          <div className="flex flex-col items-center border-l border-gray-700 px-4">
            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Duration</span>
            <span className="text-red-400 font-bold">{elapsedTime}</span>
          </div>
          <div className="flex flex-col items-center border-l border-gray-700 px-4">
            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Pings</span>
            <span className="text-white font-medium">{sessionData?.coords?.length || 0}</span>
          </div>
          {sessionData?.lastCoord?.accuracy && (
            <div className="flex flex-col items-end border-l border-gray-700 pl-4 hidden sm:flex">
              <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Accuracy</span>
              <span className="text-white font-medium font-mono">±{Math.round(sessionData.lastCoord.accuracy)}m</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BeaconView;
