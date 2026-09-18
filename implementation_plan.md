# Miles Morales Night-Walk — MVP Implementation Plan

A mobile-first web app with two core features for the hackathon first round:

1. **Shake-to-SOS** — Shake the phone (or tap a panic button) to trigger an SOS that streams your live GPS to Firebase.
2. **Guardian Beacon** — Instantly share a live-tracking link with trusted contacts via WhatsApp / Web Share so they can watch you walk home in real time.

> [!NOTE]
> **Deferred to post-MVP:** Crowdsourced Safety Map, Safe Route computation, user accounts/auth. These can be layered on after the first round.

## User Review Required

> [!WARNING]
> **HTTPS is mandatory for the demo.**
> Both `DeviceMotionEvent` (shake) and `Geolocation` require HTTPS + explicit user permission on iOS/Android. We'll use **`npx localtunnel`** or **Vercel** (free tier, instant deploy) so the app works on a real phone.

> [!IMPORTANT]
> **Alert delivery: WhatsApp deep-links + Web Share API.**
> No Twilio needed. When SOS fires, we generate a tracking URL and open `https://wa.me/<phone>?text=...` pre-filled with the contact's number and the live-tracking link. On Android the Web Share API lets the user pick any app. This is instant and zero-config.

## Open Questions

1. **Do you already have a Firebase project?** If not, I'll walk you through creating one (takes ~2 minutes in the Firebase Console). We need Firestore enabled with open security rules for the hackathon.
2. **Any extra feature you'd like squeezed in?** A quick "add to home screen" PWA prompt is low effort and high demo impact — want it?

## Proposed Changes

The app will be scaffolded directly into the workspace root (`Nightwalk/`) — no nested subfolder.

### Tech Stack
| Layer | Choice | Why |
|-------|--------|-----|
| Scaffold | Vite + React | Fast cold starts, instant HMR |
| Styling | Tailwind CSS **v3** | Rapid mobile-first UI, well-documented |
| Database | Firebase Firestore | Real-time `onSnapshot` listeners, free tier |
| Maps | Leaflet.js (`react-leaflet`) | Free, no API key needed |
| Sensors | DeviceMotionEvent, Geolocation API | Built into browsers |

---

### Core Files

#### [NEW] `src/App.jsx`
Single-page layout with **state-based view switching** (no router needed). Three states:
- `idle` → shows the home screen with a large SOS button and trusted-contacts list.
- `sos-active` → full-screen SOS overlay streaming location.
- `beacon` → the public tracking page a guardian opens from the shared link.

#### [NEW] `src/components/SOSButton.jsx`
A large, animated panic button. Tapping it (or shaking) triggers the SOS flow. Includes the iOS-required "Enable Motion Sensors" permission prompt button.

#### [NEW] `src/components/SOSOverlay.jsx`
Full-screen overlay that activates during an SOS. Shows:
- A pulsing red beacon animation.
- Live map centered on the user's position (Leaflet).
- "Share with Guardian" button (fires WhatsApp / Web Share).
- "I'm Safe" cancel button that ends the session.

#### [NEW] `src/components/BeaconView.jsx`
The page a guardian sees when they open the shared tracking link. Renders a read-only Leaflet map that subscribes to the Firestore SOS session document via `onSnapshot` and moves the marker in real time. No login required.

#### [NEW] `src/components/TrustedContacts.jsx`
Simple form to add/remove up to 3 trusted contacts (name + phone number). Stored in `localStorage` — no auth needed for MVP.

---

### Hooks

#### [NEW] `src/hooks/useShakeDetection.js`
Listens to `DeviceMotionEvent`, computes acceleration magnitude, and fires a callback when it exceeds a threshold (~15 m/s²). Handles the iOS permission request flow (`DeviceMotionEvent.requestPermission()`).

#### [NEW] `src/hooks/useLiveLocation.js`
Wraps `navigator.geolocation.watchPosition`. Returns `{ lat, lng, accuracy, error }`. Automatically starts/stops when the SOS session is active.

#### [NEW] `src/hooks/useSOSSession.js`
**The orchestration layer.** Manages the full SOS lifecycle:
1. Creates a Firestore document in `sos_sessions/{id}` with `{ active: true, startedAt, coords: [] }`.
2. Pushes location updates from `useLiveLocation` into the document.
3. Generates the shareable beacon URL: `<origin>/beacon/{id}`.
4. Triggers the WhatsApp/Web-Share dispatch to trusted contacts.
5. Ends the session (`active: false`) when the user taps "I'm Safe".

---

### Firebase

#### [NEW] `src/firebase/config.js`
Firebase initialization. Config values will be read from a `.env` file (`VITE_FIREBASE_*` vars) so nothing is hardcoded into source.

#### Firebase Setup Steps (manual, ~2 min)
1. Go to [Firebase Console](https://console.firebase.google.com/) → Create Project → name it `nightwalk`.
2. Enable **Firestore Database** in test mode (open rules — fine for hackathon).
3. Register a **Web App**, copy the config object.
4. Paste the values into a `.env` file in the project root:
   ```env
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   ```

---

### WhatsApp Live Tracking (Deep-Link Flow)

#### [NEW] `src/utils/shareAlert.js`
Utility that dispatches the SOS alert to all trusted contacts. The full flow:

1. **SOS triggers** → `useSOSSession` creates a Firestore session and generates a beacon URL:
   ```
   https://<your-app>.vercel.app/?beacon=<sessionId>
   ```
2. **For each trusted contact**, this utility builds a WhatsApp deep-link:
   ```
   https://wa.me/<contactPhone>?text=🚨 SOS from <userName>! I need help. Track my live location here: <beaconURL>
   ```
3. **Dispatch strategy:**
   - **Primary:** Opens the WhatsApp deep-link directly — the message is pre-filled with the contact's phone number and the live-tracking URL. The user just taps "Send".
   - **Fallback (Android):** If the Web Share API is available (`navigator.share`), offer a generic share sheet so the user can pick any messaging app.
   - **Multi-contact:** If there are multiple trusted contacts, dispatches to the first contact via WhatsApp deep-link, then shows a "Send to next contact" button for subsequent contacts (browsers block multiple `window.open` calls).

4. **What the guardian sees:** They tap the link in WhatsApp → it opens `BeaconView` in their browser → a live Leaflet map tracks the user's position in real time via Firestore `onSnapshot`. No app install or login required.

> [!TIP]
> The beacon URL uses a query parameter (`?beacon=<id>`) instead of a path segment so we don't need a router — `App.jsx` just checks `URLSearchParams` on load and renders `BeaconView` if present.

---

### Styling & Assets

#### [NEW] `src/index.css`
Global styles + Tailwind directives. Dark theme by default (fits the "night walk" brand). Pulsing red animation keyframes for the SOS state.

#### [NEW] `public/manifest.json` *(optional, if PWA is approved)*
Minimal PWA manifest so users can "Add to Home Screen" for instant access.

## Verification Plan

### Automated Tests
- N/A for this sprint. All testing is manual.

### Manual Verification
1. **Desktop (Chrome DevTools):**
   - Mock geolocation via Sensors tab.
   - Verify SOS session creates a Firestore document and location updates flow in.
   - Open the beacon URL in a second tab — confirm the map tracks in real time.
2. **Real Device:**
   - Deploy via Vercel or `npx localtunnel`.
   - Open on phone, grant motion + location permissions.
   - Shake the phone → SOS overlay should appear.
   - Tap "Share" → WhatsApp should open pre-filled with the beacon link.
   - Open the beacon link on a second device → confirm live tracking.
   - Tap "I'm Safe" → session ends, beacon page shows "Session ended".
