import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
    PUBLIC_CONTEXT: { public: true, static: true },
    PUBLIC_FIREBASE_PROJECT_ID: { public: true, static: true },
    PUBLIC_READER: { public: true, static: true },
    PUBLIC_FIREBASE_API_KEY: { public: true, static: true },
    PUBLIC_FIREBASE_AUTH_DOMAIN: { public: true, static: true },
    PUBLIC_FIREBASE_STORAGE_BUCKET: { public: true, static: true },
    PUBLIC_FIREBASE_MESSAGING_SENDER_ID: { public: true, static: true },
    PUBLIC_FIREBASE_APP_ID: { public: true, static: true },
});
