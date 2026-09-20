import React, { useState, useEffect } from 'react';
import { AlertCircle, X, Share2, MapPin, CheckCircle, Clock, Wifi } from 'lucide-react';
import { useSOSSession } from '../hooks/useSOSSession';
import { shareAlert, buildWhatsAppUrl, safeOpen } from '../utils/shareAlert';
import { loadTrustedContacts } from './TrustedContacts';

/**
 * SOSOverlay — full-screen SOS view with enhanced UI.
 * Uses useSOSSession to manage Firestore session + live location.
 * Shares beacon URL to trusted contacts via WhatsApp/Web Share.
 */
const SOSOverlay = ({ isActive, onClose }) => {
  const { location, locationError, beaconUrl, firestoreError, endSession } = useSOSSession(isActive);
  const [shared, setShared] = useState(false);
  const [shareError, setShareError] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [contacts, setContacts] = useState([]);

  // Load contacts whenever SOS activates
  useEffect(() => {
    if (isActive) {
      setContacts(loadTrustedContacts());
    }
  }, [isActive]);

  // Live elapsed-time clock — resets when SOS closes
  useEffect(() => {
    if (!isActive) {
      setElapsed(0);
      return;
    }
    const timer = setInterval(() => setElapsed(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, [isActive]);

  if (!isActive) return null;

  const handleShare = async () => {
    setShareError('');
    if (!beaconUrl) {
      setShareError('Beacon URL not ready yet — try again in a moment.');
      return;
    }

    try {
      const result = await shareAlert(beaconUrl, contacts);
      setShared(true);
      console.log('Alert dispatched via:', result.method);
    } catch (err) {
      setShareError('Could not share. Try copying the link manually.');
      console.error(err);
    }
  };

  const handleDirectWhatsApp = (phone) => {
    if (!beaconUrl) return;
    const url = buildWhatsAppUrl(phone, beaconUrl);
    safeOpen(url);
  };

  const handleImSafe = async () => {
    await endSession();
    setShared(false);
    setElapsed(0);
    onClose();
  };

  // Format elapsed seconds as MM:SS
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-gradient-to-b from-red-700 via-red-600 to-red-900 text-white flex flex-col items-center justify-center p-6">
      {/* Close / I'm Safe button */}
      <button
        onClick={handleImSafe}
        className="absolute top-6 right-6 p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors backdrop-blur-sm"
        aria-label="End SOS"
      >
        <X size={28} />
      </button>

      <div className="text-center space-y-5 max-w-sm w-full">
        {/* Double-ring pulsing icon */}
        <div className="relative flex items-center justify-center">
          <span className="absolute w-36 h-36 rounded-full bg-red-400/30 animate-ping" style={{ animationDuration: '2s' }} />
          <span className="absolute w-28 h-28 rounded-full bg-red-400/20 animate-ping" style={{ animationDuration: '2.5s' }} />
          <AlertCircle size={80} className="relative text-white drop-shadow-2xl" />
        </div>

        <h1 className="text-5xl font-extrabold tracking-tight">SOS ACTIVE</h1>

        {/* Status Row: elapsed clock + GPS accuracy */}
        <div className="flex items-center justify-center gap-4 text-sm">
          <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
            <Clock size={14} />
            <span className="font-mono font-bold">{formatTime(elapsed)}</span>
          </div>
          <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
            <Wifi size={14} />
            <span className="font-mono">
              {location ? `±${Math.round(location.accuracy || 0)}m` : 'GPS...'}
            </span>
          </div>
        </div>

        {/* GPS Coords */}
        <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl flex items-center justify-center gap-2">
          <MapPin size={20} />
          <span className="text-sm font-mono">
            {location
              ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`
              : 'Acquiring GPS signal...'}
          </span>
        </div>

        {/* Beacon / tracking URL */}
        {beaconUrl && (
          <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl text-xs break-all">
            <p className="text-white/60 mb-1 text-left">📎 Live tracking link:</p>
            <a
              href={beaconUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white underline"
            >
              {beaconUrl}
            </a>
          </div>
        )}

        {/* Multi-Contact Direct WhatsApp Buttons if multiple contacts exist */}
        {contacts && contacts.length > 1 && (
          <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl space-y-2 text-left">
            <p className="text-xs font-semibold text-white/80">Direct WhatsApp Dispatch:</p>
            <div className="flex flex-wrap gap-2">
              {contacts.map((c, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleDirectWhatsApp(c.phone)}
                  className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/30 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all active:scale-95"
                >
                  💬 Alert {c.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Error states */}
        {(locationError || firestoreError || shareError) && (
          <p className="text-sm bg-red-900/60 backdrop-blur-sm p-3 rounded-xl text-left">
            {locationError || firestoreError || shareError}
          </p>
        )}

        {/* Share button */}
        <button
          onClick={handleShare}
          className="w-full bg-white text-red-600 hover:bg-gray-100 font-bold py-4 px-6 rounded-full shadow-2xl flex items-center justify-center gap-2 text-lg transition-transform active:scale-95"
        >
          {shared ? <CheckCircle size={22} /> : <Share2 size={22} />}
          <span>{shared ? 'Alert Sent! Share Again?' : '🆘 Alert My Contacts'}</span>
        </button>

        {/* I'm Safe button */}
        <button
          onClick={handleImSafe}
          className="w-full bg-transparent border-2 border-white/40 text-white font-semibold py-3 px-6 rounded-full flex items-center justify-center gap-2 hover:bg-white/10 transition-colors backdrop-blur-sm"
        >
          ✅ I'm Safe — End SOS
        </button>
      </div>
    </div>
  );
};

export default SOSOverlay;
