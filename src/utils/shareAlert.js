/**
 * Dispatches SOS alerts to trusted contacts via WhatsApp deep-links
 * and/or the Web Share API.
 *
 * @param {string} beaconUrl - The live-tracking URL to share
 * @param {Array<{name: string, phone: string}>} contacts - Trusted contacts from localStorage
 */
export const shareAlert = async (beaconUrl, contacts = []) => {
  const message = `🚨 SOS Alert! I need help. Track my live location here: ${beaconUrl}`;

  // Strategy 1: Web Share API (Android Chrome — picks any app)
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
        console.error('Web Share failed:', err);
      }
      // Fall through to WhatsApp if user cancelled or it errored
    }
  }

  // Strategy 2: WhatsApp deep-link to the first trusted contact
  if (contacts.length > 0) {
    const first = contacts[0];
    // Strip all non-digit characters from phone number
    const phone = first.phone.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    return { method: 'whatsapp', contact: first.name, remaining: contacts.slice(1) };
  }

  // Strategy 3: Generic WhatsApp share without a specific number
  const genericUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
  window.open(genericUrl, '_blank');
  return { method: 'whatsapp-generic', success: true };
};
