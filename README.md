# Guardian Beacon — Night-Walk Safety App

> Built for Bit and Build Hackathon · Problem Statement #4

A mobile-first Progressive Web App that protects night-time commuters through two core safety features: instant shake-triggered SOS and live location sharing with trusted contacts.

---

## Problem

Walking home late at night is risky — especially in poorly lit or isolated areas. In a moment of real distress, manually opening an app and texting someone for help is too slow and cognitively demanding.

---

## Solution

**Guardian Beacon** reduces the response time for a safety alert to a single physical action — shaking your phone.

### Core Features

**Shake-to-SOS**
Uses the device accelerometer (`DeviceMotionEvent`) to detect aggressive shaking. Instantly triggers a full-screen SOS mode with live GPS tracking. Also accessible via a large on-screen panic button as a tap fallback.

**Guardian Beacon (Live Tracking)**
When SOS activates, a unique tracking session is created in Firebase Firestore. A shareable link is generated and dispatched to pre-saved trusted contacts via WhatsApp deep-link (`wa.me`) or the Web Share API. The contact opens the link and watches a live-updating map — no app install, no login.

**Trusted Contacts**
Users pre-save up to 3 emergency contacts (name + phone with country code) in localStorage. On SOS, contacts receive a WhatsApp message pre-filled with the live tracking URL.

**PWA**
Installable to the Android home screen via `manifest.json` for one-tap access.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 5 |
| Styling | Tailwind CSS v3 |
| Maps | Leaflet.js, React-Leaflet |
| Real-time DB | Firebase Firestore (onSnapshot) |
| Sensors | DeviceMotionEvent, Geolocation API |
| Alert Dispatch | WhatsApp deep-links, Web Share API |

---

## How to Run Locally

**Prerequisites:** Node.js v18+

```bash
# 1. Install dependencies
npm install

# 2. Add Firebase config
# Edit .env with your Firebase project values (see .env.example)

# 3. Start dev server
npm run dev
```

Open `http://localhost:5173`.

> Note: Shake detection and Geolocation require HTTPS. For testing on a real device, deploy to Vercel or use `npx localtunnel --port 5173`.

---

## Firebase Setup (for evaluators running locally)

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Firestore in **Test Mode**
3. Register a Web App and copy the config object
4. Paste values into `.env` (see `.env.example` for the required keys)
5. In Firestore → Rules, set `allow read, write: if true;`

---

## Demo Flow

1. Open the app on a phone (over HTTPS)
2. Add a trusted contact with their phone number
3. Shake the phone or tap the SOS button
4. Tap "Alert My Contacts" — WhatsApp opens pre-filled with a live tracking link
5. The contact opens the link and sees a real-time map of your location
6. Tap "I'm Safe" to end the session

---

## Architecture

```
User's Phone                    Guardian's Phone
─────────────────               ─────────────────
Shake detected
→ useSOSSession creates          
  Firestore document             
→ useLiveLocation streams   →   BeaconView reads via
  GPS coords to Firestore        onSnapshot listener
→ shareAlert sends          →   Opens tracking link
  WhatsApp deep-link             in browser, no login
```

---

## Future Scope

- AI-powered route safety scoring using crime and lighting datasets
- Crowdsourced safety map with community hazard markers
- Campus security direct webhook integration
- Smartwatch / wearable SOS trigger via Bluetooth
