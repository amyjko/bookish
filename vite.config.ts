import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    plugins: [
        sveltekit({
            // script: true so svelte-package publishes components with their
            // TypeScript compiled to JavaScript, as earlier versions did.
            // Avoid TS enums in components: this transform drops an enum's
            // declaration when only the markup uses it.
            preprocess: vitePreprocess({ script: true }),
            adapter: adapter(),
        }),
    ],
    build: {
        // The Firebase SDK vendor chunk is ~610KB minified (firebase 13; it
        // was ~580KB on 12); that's the SDK's size, not an app-splitting
        // problem. Raise the warning threshold just past it so genuine
        // regressions still warn.
        chunkSizeWarningLimit: 640,
    },
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
