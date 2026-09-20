# Guardian Beacon — Night-Walk Safety App

> Built for Bit and Build Hackathon · Problem Statement #4

A mobile-first Progressive Web Application (PWA) that protects night-time commuters through discreet shake-triggered SOS, a 5-second false-alarm countdown latch, real-time location telemetry, and zero-install live tracking for trusted contacts.

---

## Problem Statement

Walking alone at night, through unfamiliar neighborhoods, or during sudden emergencies poses significant personal safety risks. In high-threat or distress situations, individuals face critical barriers:

1. **Slow Reaction & Device Barriers:** Unlocking a smartphone, opening contact lists, or dialing emergency services requires fine motor skills, screen visibility, and precious seconds that a person under duress or physical threat rarely has.
2. **Lack of Continuous, Real-Time Context:** Traditional SMS or emergency calls broadcast a static, one-time alert without real-time tracking, leaving emergency contacts blind if the individual is on the move.
3. **App Barrier & Friction:** Many proprietary safety apps require both user and contacts to install heavy native apps, register accounts, and grant invasive background permissions—creating high adoption friction during emergencies.

---

## Solution Description

**Guardian Beacon** reduces emergency activation to a single physical gesture: shaking your phone. It establishes an instant, temporary live beacon that guardians can follow in real time from any browser with zero installation required.

### Core Features

* **Discreet Shake-to-SOS:** Uses the device accelerometer (`DeviceMotionEvent`) to detect physical shakes. Works covertly without needing to look at or unlock the screen.
* **5-Second False Alarm Latch:** Initiates a 5-second cancellation countdown with haptic feedback (`navigator.vibrate`) before full emergency dispatch, preventing accidental triggers while maintaining quick response.
* **Live Guardian Beacon (Real-Time Tracking):** Generates an ephemeral session in Firebase Firestore streaming live GPS coordinates, heading, accuracy, and device battery level.
* **Zero-Install Guardian View:** Trusted contacts receive a WhatsApp (`wa.me`) or Web Share link and monitor the live tracking map directly in their browser without downloading an app or logging in.
* **Gridline Telemetry Dashboard:** A tactical, dark-themed UI displaying live GPS stats, satellite signal quality, motion sensor diagnostics, and quick-action emergency dials.
* **Incident History & Audit Trail:** Automatically records timestamped logs of SOS triggers, duration, and status locally for post-incident review and accountability.
* **Trusted Contacts Management:** Pre-configure up to 3 emergency contacts stored locally with instant alert dispatch.
* **Store-Ready PWA:** Features a custom cache-first Service Worker, maskable PNG icons (192×192, 512×512), mobile/desktop preview screenshots, and shortcut actions for offline reliability and home screen installation.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 5 |
| Styling | Tailwind CSS v3, Lucide React |
| Maps | Leaflet.js, React-Leaflet |
| Real-time DB | Firebase Firestore (`onSnapshot`, real-time sync) |
| Device APIs | `DeviceMotionEvent`, Geolocation API, Vibration API, Web Share API |
| Offline / PWA | Service Worker (`CacheStorage`), Web App Manifest |
| Alert Dispatch | WhatsApp deep-links (`wa.me`), Web Share API |

---

## How to Run Locally

**Prerequisites:** Node.js v18+

```bash
# 1. Install dependencies
npm install

# 2. Add Firebase config
# Copy .env.example to .env and fill in your Firebase project values
cp .env.example .env

# 3. Start development server
npm run dev
```

Open `http://localhost:5173`.

> **Note:** Shake detection (`DeviceMotionEvent`), Geolocation, and Service Workers require HTTPS on mobile devices. For testing on a physical phone, deploy to Vercel or expose your local port with a tunnel like `ngrok` or `localtunnel`.

---

## Firebase Setup (for Evaluators Running Locally)

1. Go to [console.firebase.google.com](https://console.firebase.google.com) and create a project.
2. Under **Build → Firestore Database**, click **Create Database** (start in **Test Mode**).
3. Register a **Web App** in project settings and copy the Firebase configuration keys.
4. Add the credentials to your `.env` file (see `.env.example`).
5. Ensure your Firestore rules allow session reads/writes (refer to `firestore.rules`).

---

## Demo Flow

```
User's Phone (PWA)                                Guardian's Phone / PC
──────────────────                                ─────────────────────
1. Shake phone or tap SOS
   ↓
2. 5s Countdown initiates (haptic buzz)
   (Allows "I'm OK" cancellation)
   ↓
3. SOS confirms → Creates Firestore session
   Streams GPS & telemetry
   ↓
4. Tap "Alert My Contacts" ───────────────────→  Receives WhatsApp message
                                                  with live tracking URL
                                                  ↓
                                                  Opens link in browser:
                                                  Watches real-time map,
                                                  speed, and coordinates
   ↓
5. User taps "I'm Safe" ──────────────────────→  Beacon marks session as resolved
   Logged to Incident History
```

---


---

## Privacy & Security

- **Ephemeral Sessions:** Location broadcast is active only while an SOS session is live.
- **No Third-Party Tracking:** No ad trackers, analytics SDKs, or background telemetry.
- **Local Data Retention:** Trusted contact details and incident history remain on the user's device (`localStorage`).
- See [PRIVACY.md](PRIVACY.md) for detailed privacy practices.

---

## Future Scope

- **AI Safety Routing:** Dynamic route scoring using open crime statistics and urban street lighting indices.
- **Crowdsourced Hazard Markers:** Community-reported hazard spots and safe-haven hubs.
- **Campus & Security Webhooks:** Direct integrations with campus police or private security dispatch systems.
- **Wearable Trigger:** BLE integration with smartwatches or physical panic button accessories.
