import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY,
  authDomain: import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase App only once
if (import.meta.env.DEV) {
  const missingKeys = Object.entries(firebaseConfig)
    .filter(([_, value]) => !value)
    .map(([key]) => key);
  if (missingKeys.length > 0) {
    console.warn(`[Firebase SDK Init] Missing environment config keys: ${missingKeys.join(', ')}. Please verify your local .env configuration.`);
  }
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);

// Initialize Firestore with local IndexedDB cache if running in the browser
let firestoreDb;
try {
  if (typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined') {
    firestoreDb = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    });
  } else {
    firestoreDb = getFirestore(app);
  }
} catch (e) {
  console.warn('Failed to initialize Firestore with persistent local cache. Falling back to default...', e);
  firestoreDb = getFirestore(app);
}

export const db = firestoreDb;
export const storage = getStorage(app);
