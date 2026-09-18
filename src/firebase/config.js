import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Guard: only initialize if the project ID is set (prevents crash on missing .env)
let app = null;
let db = null;

if (firebaseConfig.projectId && firebaseConfig.projectId !== 'YOUR_PROJECT_ID') {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  console.log('✅ Firebase initialized — Firestore is live.');
} else {
  console.warn(
    '⚠️ Firebase not configured. Fill in your .env file with real Firebase values. ' +
    'The app will run in offline/demo mode.'
  );
}

export { app, db };
