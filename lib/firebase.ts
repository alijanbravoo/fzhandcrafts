import { initializeApp, getApps } from 'firebase/app';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  getFirestore,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Sanitize storage bucket: if user provides gs:// prefix, strip it for config
const rawBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '';
const sanitizedBucket = rawBucket.replace(/^gs:\/\//, '').trim();

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: sanitizedBucket || (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.appspot.com` : undefined),
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firestore with IndexedDB multi-tab persistent caching on browser
let firestoreDb;
if (typeof window !== 'undefined') {
  try {
    firestoreDb = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
  } catch (e) {
    // Fallback if already initialized or browser does not support IndexedDB
    firestoreDb = getFirestore(app);
  }
} else {
  firestoreDb = getFirestore(app);
}

// Safely initialize Firebase Storage with fallback
let storageInstance: FirebaseStorage | null = null;
try {
  storageInstance = getStorage(app);
} catch (e) {
  console.warn('Firebase Storage initialization failed or bucket not configured:', e);
}

export const db = firestoreDb;
export const auth = getAuth(app);
export const storage = storageInstance;
