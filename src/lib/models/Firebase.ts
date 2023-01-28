import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';
import { connectStorageEmulator, getStorage } from 'firebase/storage';
import {
    PUBLIC_CONTEXT,
    PUBLIC_FIREBASE_API_KEY,
    PUBLIC_FIREBASE_AUTH_DOMAIN,
    PUBLIC_FIREBASE_PROJECT_ID,
    PUBLIC_FIREBASE_STORAGE_BUCKET,
    PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    PUBLIC_FIREBASE_APP_ID,
} from '$env/static/public';

const isReader = typeof PUBLIC_FIREBASE_API_KEY === 'undefined';

// Some feedback about context
if (PUBLIC_CONTEXT !== 'prod')
    console.log(`*** ${PUBLIC_CONTEXT.toLocaleUpperCase()} ***`);

// Initialize Firebase using the environment variables provided at build time.
// Only do this if we have environment variables defined. (We won't in the standalone Reader).
export const app = isReader
    ? undefined
    : initializeApp({
          apiKey: PUBLIC_FIREBASE_API_KEY,
          authDomain: PUBLIC_FIREBASE_AUTH_DOMAIN,
          projectId: PUBLIC_FIREBASE_PROJECT_ID,
          storageBucket: PUBLIC_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
          appId: PUBLIC_FIREBASE_APP_ID,
      });

export const auth = isReader ? undefined : getAuth();
export const db = isReader ? undefined : getFirestore();
export const storage = isReader ? undefined : getStorage();
export const functions = isReader ? undefined : getFunctions();

if (!isReader && PUBLIC_CONTEXT === 'local') {
    if (db) connectFirestoreEmulator(db, 'localhost', 8080);
    if (auth) connectAuthEmulator(auth, 'http://localhost:9099');
    if (storage) connectStorageEmulator(storage, 'localhost', 9199);
    if (functions) connectFunctionsEmulator(functions, 'localhost', 5001);
}
