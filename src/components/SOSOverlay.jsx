import React, { useState } from 'react';
import { AlertCircle, X, Share2, MapPin, CheckCircle } from 'lucide-react';
import { useSOSSession } from '../hooks/useSOSSession';
import { shareAlert } from '../utils/shareAlert';
import { loadTrustedContacts } from './TrustedContacts';

/**
 * SOSOverlay — full-screen SOS view.
 * Uses useSOSSession to manage Firestore session + live location.
 * Shares beacon URL to trusted contacts via WhatsApp/Web Share.
 */
const SOSOverlay = ({ isActive, onClose }) => {
  const { location, locationError, beaconUrl, firestoreError, endSession } = useSOSSession(isActive);
  const [shared, setShared] = useState(false);
  const [shareError, setShareError] = useState('');

  if (!isActive) return null;

  const handleShare = async () => {
    setShareError('');
    if (!beaconUrl) {
      setShareError('Beacon URL not ready yet — try again in a moment.');
      return;
    }

    const contacts = loadTrustedContacts();

    try {
      const result = await shareAlert(beaconUrl, contacts);
      setShared(true);
      console.log('Alert dispatched via:', result.method);
    } catch (err) {
      setShareError('Could not share. Try copying the link manually.');
      console.error(err);
    }
  };

  const handleImSafe = async () => {
    await endSession();
    setShared(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-red-600 text-white flex flex-col items-center justify-center p-6">
      {/* Close / I'm Safe button */}
      <button
        onClick={handleImSafe}
        className="absolute top-6 right-6 p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
        aria-label="End SOS"
      >
        <X size={28} />
      </button>

      <div className="text-center space-y-5 max-w-sm w-full">
        {/* Pulsing icon */}
        <div className="relative flex items-center justify-center">
          <span className="absolute w-32 h-32 rounded-full bg-red-400 opacity-40 animate-ping-slow" />
          <AlertCircle size={96} className="relative text-white" />
        </div>

        <h1 className="text-5xl font-extrabold tracking-tight">SOS ACTIVE</h1>

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
              rel="noreferrer"
              className="text-white underline"
            >
              {beaconUrl}
            </a>
          </div>
        )}

        {/* Error states */}
        {(locationError || firestoreError || shareError) && (
          <p className="text-sm bg-red-800 p-2 rounded-lg text-left">
            {locationError || firestoreError || shareError}
          </p>
        )}

        {/* Share button */}
        <button
          onClick={handleShare}
          className="w-full bg-white text-red-600 hover:bg-gray-100 font-bold py-4 px-6 rounded-full shadow-2xl flex items-center justify-center gap-2 text-lg transition-transform active:scale-95"
        >
          {shared ? <CheckCircle size={22} /> : <Share2 size={22} />}
          <span>{shared ? 'Alert Sent! Send Again?' : 'Alert My Contacts'}</span>
        </button>

        {/* I'm Safe button */}
        <button
          onClick={handleImSafe}
          className="w-full bg-transparent border-2 border-white/50 text-white font-semibold py-3 px-6 rounded-full flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
        >
          ✅ I'm Safe — End SOS
        </button>
      </div>
    </div>
  );
};

export default SOSOverlay;
