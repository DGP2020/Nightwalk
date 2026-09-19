import React, { useState, useEffect } from 'react';

const STORAGE_KEY = 'nightwalk_trusted_contacts';

/**
 * Generates a consistent colour class for a contact avatar based on their name.
 */
function getAvatarColor(name) {
  const colors = [
    'bg-blue-500', 'bg-emerald-500', 'bg-purple-500',
    'bg-amber-500', 'bg-pink-500', 'bg-cyan-500',
  ];
  const index = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length;
  return colors[index];
}

/**
 * Trusted contacts manager — stores up to 3 contacts in localStorage.
 * Contacts are used by shareAlert.js to pre-fill WhatsApp messages.
 */
const TrustedContacts = ({ onContactsChange }) => {
  const [contacts, setContacts] = useState([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      setContacts(parsed);
      onContactsChange?.(parsed);
    }
  }, []);

  const save = (updated) => {
    setContacts(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    onContactsChange?.(updated);
  };

  const addContact = () => {
    setError('');
    if (!name.trim() || !phone.trim()) {
      setError('Both name and phone are required.');
      return;
    }
    if (contacts.length >= 3) {
      setError('Max 3 trusted contacts allowed.');
      return;
    }
    const updated = [...contacts, { name: name.trim(), phone: phone.trim() }];
    save(updated);
    setName('');
    setPhone('');
  };

  const removeContact = (index) => {
    const updated = contacts.filter((_, i) => i !== index);
    save(updated);
  };

  return (
    <div className="bg-gray-800 rounded-2xl p-4 w-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-white font-bold text-base flex items-center gap-2">
          👥 Trusted Contacts
        </h2>
        <span className="text-xs text-gray-500">{contacts.length}/3</span>
      </div>

      {contacts.length === 0 && (
        <div className="text-center py-4">
          <p className="text-3xl mb-2">🫂</p>
          <p className="text-gray-500 text-sm">
            Add contacts to auto-alert via WhatsApp when SOS fires.
          </p>
        </div>
      )}

      {/* Contact list */}
      <ul className="space-y-2 mb-3">
        {contacts.map((c, i) => (
          <li key={i} className="flex items-center justify-between bg-white/5 rounded-xl px-3 py-2.5 group">
            <div className="flex items-center gap-3">
              {/* Coloured avatar with initial */}
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${getAvatarColor(c.name)}`}>
                {c.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-white text-sm font-semibold">{c.name}</p>
                <p className="text-gray-400 text-xs flex items-center gap-1">
                  <span className="text-green-500">💬</span> {c.phone}
                </p>
              </div>
            </div>
            <button
              onClick={() => removeContact(i)}
              className="text-gray-600 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
              aria-label={`Remove ${c.name}`}
            >
              🗑
            </button>
          </li>
        ))}
      </ul>

      {/* Add contact form */}
      {contacts.length < 3 && (
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Contact name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-white/5 text-white placeholder-gray-600 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-500 border border-white/10"
          />
          <input
            type="tel"
            placeholder="Phone with country code (+91...)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full bg-white/5 text-white placeholder-gray-600 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-500 border border-white/10"
          />
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button
            onClick={addContact}
            className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold py-2.5 rounded-xl text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            👤 Add Contact
          </button>
        </div>
      )}
    </div>
  );
};

export default TrustedContacts;

// Helper to load contacts without rendering the component (used by SOSOverlay / shareAlert)
export const loadTrustedContacts = () => {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : [];
};
