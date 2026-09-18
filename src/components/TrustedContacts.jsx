import React, { useState, useEffect } from 'react';

const STORAGE_KEY = 'nightwalk_trusted_contacts';

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
      <h2 className="text-white font-bold text-base mb-3">👥 Trusted Contacts</h2>

      {contacts.length === 0 && (
        <p className="text-gray-500 text-sm mb-3">
          Add contacts to auto-alert via WhatsApp when SOS fires.
        </p>
      )}

      {/* Contact list */}
      <ul className="space-y-2 mb-3">
        {contacts.map((c, i) => (
          <li key={i} className="flex items-center justify-between bg-gray-700 rounded-xl px-3 py-2">
            <div>
              <p className="text-white text-sm font-semibold">{c.name}</p>
              <p className="text-gray-400 text-xs">{c.phone}</p>
            </div>
            <button
              onClick={() => removeContact(i)}
              className="text-red-400 hover:text-red-300 text-xs font-bold ml-2"
              aria-label={`Remove ${c.name}`}
            >
              ✕
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
            className="w-full bg-gray-700 text-white placeholder-gray-500 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500"
          />
          <input
            type="tel"
            placeholder="Phone with country code (+91...)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full bg-gray-700 text-white placeholder-gray-500 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500"
          />
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button
            onClick={addContact}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-xl text-sm transition-colors"
          >
            + Add Contact
          </button>
        </div>
      )}
    </div>
  );
};

export default TrustedContacts;

// Helper to load contacts without rendering the component (used by shareAlert caller)
export const loadTrustedContacts = () => {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : [];
};
