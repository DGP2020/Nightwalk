import React, { useState, useEffect, useCallback } from 'react';
import { X, Clock, MapPin, ExternalLink, Copy, Trash2, ShieldCheck, ChevronRight } from 'lucide-react';
import { getIncidents, clearIncidents, formatDuration, formatTimestamp } from '../utils/incidentLog';

/**
 * IncidentHistoryModal — a slide-in sidebar that shows past SOS sessions
 * stored locally in localStorage. Opened via a header icon, never
 * shown on the primary emergency dashboard.
 */
const IncidentHistoryModal = ({ isOpen, onClose }) => {
  const [incidents, setIncidents] = useState([]);
  const [confirmClear, setConfirmClear] = useState(false);
  const [copied, setCopied] = useState(null);

  // Reload incidents every time the sidebar opens
  useEffect(() => {
    if (isOpen) {
      setIncidents(getIncidents());
      setConfirmClear(false);
      setCopied(null);
    }
  }, [isOpen]);

  const handleClear = useCallback(() => {
    if (confirmClear) {
      clearIncidents();
      setIncidents([]);
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
    }
  }, [confirmClear]);

  const handleCopyLink = useCallback(async (url, id) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Fallback for Safari PWA
      const el = document.createElement('textarea');
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    }
  }, []);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9990] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar panel */}
      <aside
        className="fixed top-0 right-0 h-full z-[9995] w-[min(360px,100vw)] bg-gray-900 border-l border-gray-700 flex flex-col shadow-2xl"
        role="dialog"
        aria-label="Incident History"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-indigo-400" />
            <h2 className="text-white font-bold text-base tracking-tight">Incident Log</h2>
            {incidents.length > 0 && (
              <span className="bg-indigo-600/30 text-indigo-300 text-xs font-semibold px-2 py-0.5 rounded-full">
                {incidents.length}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
            aria-label="Close incident log"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto px-4 py-3 space-y-3">

          {incidents.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-16">
              <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center">
                <ShieldCheck size={32} className="text-gray-600" />
              </div>
              <p className="text-gray-400 font-medium">No incidents recorded</p>
              <p className="text-gray-600 text-xs max-w-[200px]">
                Past SOS sessions will appear here after you tap "I'm Safe" to end them.
              </p>
            </div>
          ) : (
            incidents.map((incident, index) => (
              <div
                key={incident.id}
                className="bg-gray-800 rounded-2xl p-4 space-y-3 border border-gray-700/50"
              >
                {/* Title row */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-white font-semibold text-sm">
                      SOS Session {incidents.length - index}
                    </p>
                    <p className="text-gray-400 text-xs mt-0.5">
                      {formatTimestamp(incident.startedAt)}
                    </p>
                  </div>
                  <span className="shrink-0 bg-red-900/40 text-red-400 text-xs font-bold px-2 py-1 rounded-lg">
                    {formatDuration(incident.durationSeconds)}
                  </span>
                </div>

                {/* Stats row */}
                <div className="flex gap-3 text-xs">
                  <div className="flex items-center gap-1 text-gray-400">
                    <Clock size={12} />
                    <span>{formatTimestamp(incident.endedAt).split(',')[1]?.trim() || 'Ended'}</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-400">
                    <MapPin size={12} />
                    <span>{incident.coordCount ?? 0} GPS points</span>
                  </div>
                </div>

                {/* Last known location */}
                {incident.lastCoord && (
                  <div className="bg-gray-700/50 rounded-lg px-3 py-2 text-xs font-mono text-gray-300">
                    Last: {incident.lastCoord.lat.toFixed(5)}, {incident.lastCoord.lng.toFixed(5)}
                  </div>
                )}

                {/* Action buttons */}
                {incident.beaconUrl && (
                  <div className="flex gap-2">
                    <a
                      href={incident.beaconUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 text-xs font-semibold py-2 px-3 rounded-xl transition-colors"
                    >
                      <ExternalLink size={13} />
                      View Route
                    </a>
                    <button
                      onClick={() => handleCopyLink(incident.beaconUrl, incident.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs font-semibold py-2 px-3 rounded-xl transition-colors"
                    >
                      <Copy size={13} />
                      {copied === incident.id ? 'Copied!' : 'Copy Link'}
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer — Privacy Controls */}
        <div className="shrink-0 border-t border-gray-700 px-4 py-3 space-y-2">
          <p className="text-gray-600 text-[11px] text-center leading-snug">
            🔒 Incident data is stored only on this device and never uploaded anywhere.
          </p>
          {incidents.length > 0 && (
            <button
              onClick={handleClear}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                confirmClear
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-red-400'
              }`}
            >
              <Trash2 size={15} />
              {confirmClear ? 'Confirm — Clear All History' : 'Clear History'}
            </button>
          )}
        </div>
      </aside>
    </>
  );
};

export default IncidentHistoryModal;
