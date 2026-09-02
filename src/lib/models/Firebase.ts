import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';
import { connectStorageEmulator, getStorage } from 'firebase/storage';
import {
    PUBLIC_READER,
    PUBLIC_CONTEXT,
    PUBLIC_FIREBASE_API_KEY,
    PUBLIC_FIREBASE_AUTH_DOMAIN,
    PUBLIC_FIREBASE_PROJECT_ID,
    PUBLIC_FIREBASE_STORAGE_BUCKET,
    PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    PUBLIC_FIREBASE_APP_ID,
} from '$env/static/public';
import { env } from '$env/dynamic/public';

const isReader = PUBLIC_READER === 'true';

// Some feedback about context
if (!isReader && PUBLIC_CONTEXT !== 'prod')
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

export const auth = isReader ? undefined : getAuth(app);
export const db = isReader ? undefined : getFirestore();
export const storage = isReader ? undefined : getStorage(app);
export const functions = isReader ? undefined : getFunctions(app);

/** Emulator ports default to the firebase.json values but can be overridden
 *  by env vars so test runs (see firebase.test.json) can use dedicated ports
 *  that don't collide with other running emulator suites. Dynamic env isn't
 *  available in every context (e.g. unit tests), hence the guard. */
function emulatorPort(name: string, fallback: string): string {
    try {
        return (
            (env as Record<string, string | undefined> | undefined)?.[name] ??
            fallback
        );
    } catch {
        return fallback;
    }
}

if (!isReader && PUBLIC_CONTEXT === 'local') {
    if (db)
        connectFirestoreEmulator(
            db,
            'localhost',
            parseInt(emulatorPort('PUBLIC_EMULATOR_FIRESTORE', '8080')),
        );
    if (auth)
        connectAuthEmulator(
            auth,
            `http://localhost:${emulatorPort('PUBLIC_EMULATOR_AUTH', '9099')}`,
        );
    if (storage)
        connectStorageEmulator(
            storage,
            'localhost',
            parseInt(emulatorPort('PUBLIC_EMULATOR_STORAGE', '9199')),
        );
    if (functions)
        connectFunctionsEmulator(
            functions,
            'localhost',
            parseInt(emulatorPort('PUBLIC_EMULATOR_FUNCTIONS', '5001')),
        );
}
