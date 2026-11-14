import { defineEnvVars } from '@sveltejs/kit/env';

/** Optional runtime overrides read when the variable is absent. */
const optional = (value: string | undefined) => value;

export const variables = defineEnvVars({
    PUBLIC_CONTEXT: { public: true, static: true },
    PUBLIC_FIREBASE_PROJECT_ID: { public: true, static: true },
    PUBLIC_READER: { public: true, static: true },
    PUBLIC_FIREBASE_API_KEY: { public: true, static: true },
    PUBLIC_FIREBASE_AUTH_DOMAIN: { public: true, static: true },
    PUBLIC_FIREBASE_STORAGE_BUCKET: { public: true, static: true },
    PUBLIC_FIREBASE_MESSAGING_SENDER_ID: { public: true, static: true },
    PUBLIC_FIREBASE_APP_ID: { public: true, static: true },
    // Emulator port overrides, set at runtime by the test and demo scripts so
    // they don't collide with other emulator suites (see firebase.test.json).
    // Firebase.ts falls back to the firebase.json ports when they're unset.
    PUBLIC_EMULATOR_AUTH: { public: true, schema: optional },
    PUBLIC_EMULATOR_FIRESTORE: { public: true, schema: optional },
    PUBLIC_EMULATOR_STORAGE: { public: true, schema: optional },
    PUBLIC_EMULATOR_FUNCTIONS: { public: true, schema: optional },
});
