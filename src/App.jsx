import React, { useState, useCallback } from 'react';
import SOSOverlay from './components/SOSOverlay';
import BeaconView from './components/BeaconView';
import CountdownOverlay from './components/CountdownOverlay';
import GridlineDashboard from './components/gridline/GridlineDashboard';
import { useShakeDetection } from './hooks/useShakeDetection';
import { useLiveLocation } from './hooks/useLiveLocation';
import { loadTrustedContacts } from './components/TrustedContacts';

function App() {
  const [sosActive, setSosActive] = useState(false);
  const [countdownActive, setCountdownActive] = useState(false);
  const [contacts, setContacts] = useState(() => loadTrustedContacts());

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
    </div>
  );
}

export default App;
