const STORAGE_KEY = 'nightwalk_incident_log';
const MAX_INCIDENTS = 10;

/**
 * Returns the list of past SOS incidents stored locally on this device.
 * @returns {Array} Array of incident objects, newest first.
 */
export function getIncidents() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Saves a new SOS incident to the local log (prepends, caps at MAX_INCIDENTS).
 * @param {Object} incident
 * @param {string} incident.id              - Firestore session ID or demo ID
 * @param {number} incident.startedAt       - Unix ms timestamp of session start
 * @param {number} incident.endedAt         - Unix ms timestamp of session end
 * @param {number} incident.durationSeconds - Total duration in seconds
 * @param {number} incident.coordCount      - Number of GPS coordinates recorded
 * @param {Object|null} incident.lastCoord  - { lat, lng } of final GPS ping
 * @param {string} incident.beaconUrl       - Full beacon tracking URL
 */
export function saveIncident(incident) {
  try {
    const existing = getIncidents();
    const updated = [incident, ...existing].slice(0, MAX_INCIDENTS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Silently fail — incident log is non-critical
  }
}

/**
 * Removes all stored incident records from this device.
 */
export function clearIncidents() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Silently fail
  }
}

/**
 * Formats a duration in seconds into a human-readable string.
 * e.g. 94 → "1m 34s"
 * @param {number} seconds
 * @returns {string}
 */
export function formatDuration(seconds) {
  if (!seconds || seconds < 1) return '< 1s';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  if (m === 0) return `${s}s`;
  return s === 0 ? `${m}m` : `${m}m ${s}s`;
}

/**
 * Formats a Unix ms timestamp into a readable date/time string.
 * e.g. "20 Sep 2026, 11:42 PM"
 * @param {number} ms
 * @returns {string}
 */
export function formatTimestamp(ms) {
  if (!ms) return 'Unknown time';
  return new Date(ms).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
