import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';
import { connectStorageEmulator, getStorage } from 'firebase/storage';

const isReader = import.meta.env.VITE_READER === 'true';

// Initialize Firebase using the environment variables provided at build time.
// Only do this if we have environment variables defined. (We won't in the standalone Reader).
export const app = isReader
    ? undefined
    : initializeApp({
          apiKey: import.meta.env.VITE_BOOKISH_FIREBASE_API_KEY,
          authDomain: import.meta.env.VITE_BOOKISH_AUTH_DOMAIN,
          projectId: import.meta.env.VITE_BOOKISH_PROJECT_ID,
          storageBucket: import.meta.env.VITE_BOOKISH_STORAGE_BUCKET,
          messagingSenderId: import.meta.env.VITE_BOOKISH_MESSAGING_SENDER_ID,
          appId: import.meta.env.VITE_BOOKISH_APP_ID,
      });

export const auth = isReader ? undefined : getAuth();
export const db = isReader ? undefined : getFirestore();
export const storage = isReader ? undefined : getStorage();
export const functions = isReader ? undefined : getFunctions();

if (!isReader && import.meta.env.DEV) {
    if (db) connectFirestoreEmulator(db, 'localhost', 8080);
    if (auth) connectAuthEmulator(auth, 'http://localhost:9099');
    if (storage) connectStorageEmulator(storage, 'localhost', 9199);
    if (functions) connectFunctionsEmulator(functions, 'localhost', 5001);
}
