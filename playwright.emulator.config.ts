import { defineConfig } from '@playwright/test';

/**
 * Playwright suite that runs the app against dedicated Firebase emulators
 * (see firebase.test.json), signing in through the auth emulator and editing
 * real seeded books. Ports are offset from firebase.json's so this suite
 * never collides with a developer's other running emulator suites.
 *
 * Requires a prior `npm run build`; `npm run test:e2e:emu` does both.
 */
export const EMULATOR_PORTS = {
    auth: '19099',
    firestore: '18080',
    storage: '19199',
    functions: '15001',
};

export default defineConfig({
    testDir: 'e2e-emulator',
    // Tests sign in and edit seeded data; run serially for determinism.
    workers: 1,
    use: {
        baseURL: 'http://localhost:4180',
        // Wide enough that marginals lay out in the right margin.
        viewport: { width: 1440, height: 900 },
    },
    // The Firebase emulators are started around this suite by
    // scripts/test-emulators.sh (via firebase emulators:exec), not here,
    // so their output is visible and shutdown is clean.
    webServer: [
        {
            command: 'npx vite preview --port 4180 --strictPort',
            url: 'http://localhost:4180',
            reuseExistingServer: !process.env.CI,
            timeout: 60000,
            env: {
                PUBLIC_EMULATOR_AUTH: EMULATOR_PORTS.auth,
                PUBLIC_EMULATOR_FIRESTORE: EMULATOR_PORTS.firestore,
                PUBLIC_EMULATOR_STORAGE: EMULATOR_PORTS.storage,
                PUBLIC_EMULATOR_FUNCTIONS: EMULATOR_PORTS.functions,
            },
        },
    ],
});
