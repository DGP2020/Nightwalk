/**
 * Generates an encoded WhatsApp deep-link URL for a given contact.
 *
 * @param {string} phone - Contact phone number
 * @param {string} beaconUrl - Live tracking URL
 * @returns {string} WhatsApp URL
 */
export const buildWhatsAppUrl = (phone, beaconUrl) => {
  const message = `🚨 SOS Alert! I need help. Track my live location here: ${beaconUrl}`;
  const cleanPhone = (phone || '').replace(/\D/g, '');
  return cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
    : `https://wa.me/?text=${encodeURIComponent(message)}`;
};

/**
 * Safely opens an external URL in a new window with tabnabbing protection.
 */
export const safeOpen = (url) => {
  return window.open(url, '_blank', 'noopener,noreferrer');
};

/**
 * Dispatches SOS alerts to trusted contacts via WhatsApp deep-links
 * and/or the Web Share API.
 *
 * @param {string} beaconUrl - The live-tracking URL to share
 * @param {Array<{name: string, phone: string}>} contacts - Trusted contacts from localStorage
 */
export const shareAlert = async (beaconUrl, contacts = []) => {
  const message = `🚨 SOS Alert! I need help. Track my live location here: ${beaconUrl}`;

  // Strategy 1: Web Share API (Android Chrome / iOS Safari — native share sheet)
  if (navigator.share) {
    try {
      await navigator.share({
        title: '🚨 Emergency SOS',
        text: message,
        url: beaconUrl,
      });
      return { method: 'webshare', success: true };
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.warn('Web Share failed or unsupported:', err);
      }
      // Fall through to WhatsApp if user cancelled or it errored
    }
  }

  // Strategy 2: WhatsApp deep-link to the first trusted contact
  if (contacts && contacts.length > 0) {
    const first = contacts[0];
    const whatsappUrl = buildWhatsAppUrl(first.phone, beaconUrl);
    safeOpen(whatsappUrl);
    return {
      method: 'whatsapp',
      success: true,
      contact: first.name,
      remaining: contacts.slice(1),
    };
  }

  // Strategy 3: Generic WhatsApp share without a specific number
  const genericUrl = buildWhatsAppUrl('', beaconUrl);
  safeOpen(genericUrl);
  return { method: 'whatsapp-generic', success: true, remaining: [] };
};
