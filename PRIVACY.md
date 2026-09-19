# Privacy Policy — Guardian Beacon

Last updated: September 19, 2026

Guardian Beacon ("Nightwalk") is built with a privacy-by-design architecture to protect individuals during late-night commutes while respecting personal privacy.

---

### 1. Data Collection & Usage
- **Live Geolocation:** Real-time GPS coordinates are captured solely when you actively trigger an emergency SOS session (or preview your location on the local radar map). Coordinates are never logged or stored prior to emergency activation.
- **Trusted Contacts:** Up to 3 emergency contacts (name and phone number) are saved locally on your device via browser `localStorage`. They are never transmitted to third-party marketing databases or advertisers.
- **Sensor Telemetry:** Device accelerometer and motion events (`DeviceMotionEvent`) are processed locally on your device in real-time to detect the kinetic 3-shake gesture. Motion data is never uploaded to external servers.

---

### 2. Live Tracking & Session Expiry
- When an SOS session activates, an ephemeral tracking record is created to allow trusted guardians to view your live path.
- When you tap **"I'm Safe"**, the emergency session terminates immediately (`active: false`) and location streaming ceases.

---

### 3. Third-Party Services
- **OpenStreetMap:** Cartographic map tiles are rendered directly from open-source OpenStreetMap servers.
- **WhatsApp Web / Mobile:** Alert messages are dispatched using client-side `wa.me` deep-links directly through your own WhatsApp account.
- **Firebase Firestore:** Encrypted cloud datastore used exclusively for real-time beacon syncing between your phone and your designated guardians.

---

### 4. Zero Data Monetization
We do not sell, rent, or monetize your location data, identity, or emergency contacts under any circumstances.
