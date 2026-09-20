import React, { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { Phone, X, ArrowUpRight } from 'lucide-react';
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

/** Smoothly re-centres the map whenever position changes — no full remount. */
const MapUpdater = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView(position, map.getZoom());
      map.invalidateSize();
    }
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
  const [docModal, setDocModal] = useState(null);

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
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              className="dark-tiles"
              maxZoom={19}
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
        <div className="absolute bottom-14 left-4 right-4 bg-gray-900/90 backdrop-blur-sm rounded-2xl p-4 z-[1000] border border-gray-800 shadow-xl flex justify-between items-center pointer-events-none">
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

      {/* Persistent Bottom Bar */}
      <footer className="h-10 w-full border-t border-slate-800/80 bg-[#0d1424]/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between text-[11px] font-mono shrink-0 select-none z-40">
        <div className="text-slate-400 flex items-center gap-2">
          <span>GUARDIAN BEACON</span>
          <span className="text-slate-600">© 2026</span>
        </div>

        <div className="flex items-center gap-3.5 sm:gap-5 text-slate-400">
          <button
            onClick={() => setDocModal("status")}
            className="flex items-center gap-2 hover:text-emerald-400 transition-colors"
            title="View System Status & Telemetry"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span>Status</span>
          </button>

          <span className="text-slate-700">|</span>

          <button
            onClick={() => setDocModal("license")}
            className="hover:text-teal-400 transition-colors"
          >
            License
          </button>

          <span className="text-slate-700">|</span>

          <button
            onClick={() => setDocModal("privacy")}
            className="hover:text-teal-400 transition-colors"
          >
            Privacy Policy
          </button>
        </div>
      </footer>

      {/* Document & Status Modal */}
      {docModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl bg-[#0d1424] border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-200 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 font-mono uppercase tracking-wider">
                {docModal === "license" && "📜 Open Source License (BSD 3-Clause)"}
                {docModal === "privacy" && "🛡️ Privacy Policy"}
                {docModal === "status" && "⚡ System Operations & Status"}
              </h3>
              <button
                onClick={() => setDocModal(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-line space-y-3">
              {docModal === "license" && (
                <div>
                  <p className="font-bold text-white mb-2">BSD 3-Clause License</p>
                  <p className="text-slate-400 mb-3">Copyright (c) 2026, Daniel</p>
                  <p className="mb-3">
                    Redistribution and use in source and binary forms, with or without
                    modification, are permitted provided that the following conditions are met:
                  </p>
                  <p className="mb-2 pl-2 border-l border-slate-700">
                    1. Redistributions of source code must retain the above copyright notice, this
                    list of conditions and the following disclaimer.
                  </p>
                  <p className="mb-2 pl-2 border-l border-slate-700">
                    2. Redistributions in binary form must reproduce the above copyright notice,
                    this list of conditions and the following disclaimer in the documentation
                    and/or other materials provided with the distribution.
                  </p>
                  <p className="mb-3 pl-2 border-l border-slate-700">
                    3. Neither the name of the copyright holder nor the names of its
                    contributors may be used to endorse or promote products derived from
                    this software without specific prior written permission.
                  </p>
                  <p className="text-slate-400 text-[11px] leading-normal">
                    THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS &quot;AS IS&quot;
                    AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
                    IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
                    DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
                    FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
                    DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
                    SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
                    CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
                    OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
                    OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
                  </p>
                </div>
              )}

              {docModal === "privacy" && (
                <div className="space-y-3">
                  <p className="font-bold text-white">Privacy-First Architecture</p>
                  <p>
                    1. <strong className="text-teal-400">Live GPS Coordinates:</strong> Only recorded and streamed during an active SOS emergency session.
                  </p>
                  <p>
                    2. <strong className="text-teal-400">Local Storage:</strong> Contact data never leaves the user&apos;s device.
                  </p>
                </div>
              )}

              {docModal === "status" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-900/90 rounded-xl border border-slate-800">
                    <span className="text-slate-400">Telemetry Stream:</span>
                    <span className="text-emerald-400 font-bold">{isSignalLive ? "ACTIVE (LIVE)" : "WAITING FOR BEACON"}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-900/90 rounded-xl border border-slate-800">
                    <span className="text-slate-400">Cartography Stream:</span>
                    <span className="text-teal-400 font-bold">OPENSTREETMAP TACTICAL (ONLINE)</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs">
              {docModal !== "status" ? (
                <a
                  href={docModal === "license" ? "/LICENSE.md" : "/PRIVACY.md"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-400 hover:underline flex items-center gap-1 font-mono"
                >
                  View {docModal === "license" ? "license.md" : "privacy policy.md"} <ArrowUpRight className="size-3.5" />
                </a>
              ) : <span />}
              <button
                onClick={() => setDocModal(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-mono text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BeaconView;
