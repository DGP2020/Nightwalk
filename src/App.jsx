import React, { useState, useEffect, useCallback } from 'react';
import SOSOverlay from './components/SOSOverlay';
import BeaconView from './components/BeaconView';
import TrustedContacts from './components/TrustedContacts';
import { useShakeDetection } from './hooks/useShakeDetection';

function App() {
  const [sosActive, setSosActive] = useState(false);
  const [contacts, setContacts] = useState([]);

  // Check if this page load is a guardian opening a beacon link
  const beaconId = new URLSearchParams(window.location.search).get('beacon');

  const onShake = useCallback(() => {
    if (!sosActive) {
      setSosActive(true);
      if (navigator.vibrate) navigator.vibrate([500, 200, 500, 200, 500]);
    }
  }, [sosActive]);

  const { requestPermission, hasPermission, error: shakeError } = useShakeDetection(onShake);

  // --- If this is a beacon link, render BeaconView directly ---
  if (beaconId) {
    return <BeaconView sessionId={beaconId} />;
  }

  // --- Main app (user's phone) ---
  return (
    <div className="h-screen w-full flex flex-col relative overflow-hidden bg-gray-900 text-white">
      
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-white">
            🛡️ Guardian Beacon
          </h1>
          <p className="text-gray-400 text-xs">Tap or shake to trigger SOS</p>
        </div>
        {hasPermission ? (
          <span className="text-xs bg-green-900 text-green-400 px-2 py-1 rounded-full font-semibold">
            ✓ Shake ready
          </span>
        ) : (
          <span className="text-xs bg-yellow-900 text-yellow-400 px-2 py-1 rounded-full font-semibold">
            ⚠ Motion off
          </span>
        )}
      </div>

      {/* Scroll content area */}
      <div className="flex-grow overflow-y-auto px-5 pb-6 space-y-5">

        {/* iOS motion permission banner */}
        {!hasPermission && (
          <div className="bg-yellow-900/60 border border-yellow-700 rounded-2xl p-4 text-sm">
            <p className="text-yellow-300 font-semibold mb-2">Enable Shake-to-SOS</p>
            <p className="text-yellow-400/80 mb-3 text-xs">
              On iOS, motion access requires your explicit permission.
            </p>
            <button
              onClick={requestPermission}
              className="bg-yellow-500 text-black font-bold py-2 px-4 rounded-xl text-sm hover:bg-yellow-400 transition-colors"
            >
              Enable Motion Sensor
            </button>
            {shakeError && (
              <p className="text-red-400 text-xs mt-2">{shakeError}</p>
            )}
          </div>
        )}

        {/* Big SOS button */}
        <div className="flex flex-col items-center py-4">
          <button
            id="sos-trigger-button"
            onClick={() => setSosActive(true)}
            className="relative w-40 h-40 rounded-full bg-red-600 hover:bg-red-700 shadow-[0_0_40px_rgba(220,38,38,0.6)] flex flex-col items-center justify-center border-4 border-red-800 active:scale-95 transition-transform"
          >
            <span className="absolute w-full h-full rounded-full bg-red-400 opacity-25 animate-ping-slow" />
            <span className="text-3xl font-black tracking-widest relative z-10">SOS</span>
            <span className="text-xs relative z-10 opacity-80 mt-1">Hold Me</span>
          </button>
          <p className="text-gray-500 text-xs mt-4">Or shake your phone vigorously</p>
        </div>

        {/* Trusted Contacts */}
        <TrustedContacts onContactsChange={setContacts} />

        {/* Info card */}
        <div className="bg-gray-800 rounded-2xl p-4 text-sm text-gray-400 space-y-2">
          <p className="text-white font-semibold text-base">How it works</p>
          <p>1. Add trusted contacts above.</p>
          <p>2. Shake your phone or tap SOS.</p>
          <p>3. A live-tracking link is created and sent via WhatsApp.</p>
          <p>4. Your guardian watches your location in real time.</p>
          <p>5. Tap "I'm Safe" when you're home.</p>
        </div>

      </div>

      {/* SOS Overlay */}
      <SOSOverlay
        isActive={sosActive}
        onClose={() => setSosActive(false)}
      />
    </div>
  );
}

export default App;
