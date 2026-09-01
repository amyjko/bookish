import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
    // script: true because some components use TS features (e.g. enums)
    // that Svelte's native TypeScript support does not handle.
    preprocess: vitePreprocess({ script: true }),

    kit: {
        adapter: adapter(),
    },
};

export default config;
