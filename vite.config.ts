import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    plugins: [sveltekit()],
    // When running under vitest, resolve Svelte to its browser build so
    // components can be mounted in jsdom rather than server-rendered.
    resolve: process.env.VITEST ? { conditions: ['browser'] } : undefined,
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['src/tests/setup.ts'],
        // Playwright tests live in e2e/ and are run by `playwright test`.
        include: ['src/**/*.test.ts'],
    },
});
