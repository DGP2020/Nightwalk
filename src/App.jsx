import React, { useState, useCallback } from 'react';
import SOSOverlay from './components/SOSOverlay';
import BeaconView from './components/BeaconView';
<<<<<<< HEAD
import TrustedContacts from './components/TrustedContacts';
import IncidentHistoryModal from './components/IncidentHistoryModal';
import { useShakeDetection } from './hooks/useShakeDetection';
import { getIncidents } from './utils/incidentLog';
import { ClipboardList } from 'lucide-react';

function App() {
  const [sosActive, setSosActive] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const incidentCount = getIncidents().length;
=======
import CountdownOverlay from './components/CountdownOverlay';
import GridlineDashboard from './components/gridline/GridlineDashboard';
import { useShakeDetection } from './hooks/useShakeDetection';
import { useLiveLocation } from './hooks/useLiveLocation';
import { loadTrustedContacts } from './components/TrustedContacts';

function App() {
  const [sosActive, setSosActive] = useState(false);
  const [countdownActive, setCountdownActive] = useState(false);
  const [contacts, setContacts] = useState(() => loadTrustedContacts());
>>>>>>> 985dba48d7924305d10321ac6b1f19f61bccc82c

  // Check if this page load is a guardian opening a beacon link
  const beaconId = new URLSearchParams(window.location.search).get('beacon');

  // Continual live location for telemetry display on the dashboard
  const { location: liveLocation } = useLiveLocation(true);

  // Multi-shake gesture triggers 5s cancellation countdown, NOT instant SOS
  const onShake = useCallback(() => {
    if (!sosActive && !countdownActive) {
      setCountdownActive(true);
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    }
  }, [sosActive, countdownActive]);

  const { requestPermission, hasPermission, error: shakeError } = useShakeDetection(onShake);

  // Countdown completed â†’ activate confirmed emergency SOS
  const handleCountdownComplete = useCallback(() => {
    setCountdownActive(false);
    setSosActive(true);
    if (navigator.vibrate) navigator.vibrate([500, 200, 500, 200, 500]);
  }, []);

  // Countdown cancelled by user ("I'm OK")
  const handleCountdownCancel = useCallback(() => {
    setCountdownActive(false);
  }, []);

  // SOS ended by user ("I'm Safe")
  const handleSOSClose = useCallback(() => {
    setSosActive(false);
  }, []);

  // SOS button tap on dashboard â€” also flows through 5s countdown
  const handleSOSTap = useCallback(() => {
    if (!sosActive && !countdownActive) {
      setCountdownActive(true);
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    }
  }, [sosActive, countdownActive]);

  // --- If this is a guardian beacon link, render BeaconView directly ---
  if (beaconId) {
    return <BeaconView sessionId={beaconId} />;
  }

  return (
<<<<<<< HEAD
    <div className="h-screen w-full flex flex-col relative overflow-hidden bg-gray-900 text-white">
      
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-white">
            🛡️ Guardian Beacon
          </h1>
          <p className="text-gray-400 text-xs">Tap or shake to trigger SOS</p>
        </div>
        <div className="flex items-center gap-2">
          {hasPermission ? (
            <span className="text-xs bg-green-900 text-green-400 px-2 py-1 rounded-full font-semibold">
              ✓ Shake ready
            </span>
          ) : (
            <span className="text-xs bg-yellow-900 text-yellow-400 px-2 py-1 rounded-full font-semibold">
              ⚠ Motion off
            </span>
          )}
          {/* Incident History trigger — tucked in header */}
          <button
            id="incident-history-button"
            onClick={() => setHistoryOpen(true)}
            className="relative p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
            aria-label="View incident history"
          >
            <ClipboardList size={20} />
            {incidentCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full">
                {incidentCount > 9 ? '9+' : incidentCount}
              </span>
            )}
          </button>
        </div>
      </div>
=======
    <div className="h-screen w-full relative overflow-hidden bg-[#0a0f1d] text-slate-100">
      {/* Primary Gridline Dashboard */}
      <GridlineDashboard
        onTriggerSOS={handleSOSTap}
        hasPermission={hasPermission}
        requestPermission={requestPermission}
        shakeError={shakeError}
        liveLocation={liveLocation}
        contacts={contacts}
        setContacts={setContacts}
      />
>>>>>>> 985dba48d7924305d10321ac6b1f19f61bccc82c

      {/* 5-Second Cancellation Countdown Overlay */}
      <CountdownOverlay
        isActive={countdownActive}
        onComplete={handleCountdownComplete}
        onCancel={handleCountdownCancel}
      />

      {/* Confirmed Full-Screen SOS Emergency Overlay */}
      <SOSOverlay
        isActive={sosActive}
        onClose={handleSOSClose}
      />

      {/* Incident History Sidebar */}
      <IncidentHistoryModal
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
      />
    </div>
  );
}

export default App;
