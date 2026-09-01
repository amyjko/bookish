import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: 'e2e',
    use: {
        baseURL: 'http://localhost:4173',
        // Wide enough that marginals lay out in the right margin
        // rather than the mobile footer (the breakpoint is 1200px).
        viewport: { width: 1440, height: 900 },
    },
    webServer: {
        // Requires a prior `npm run build`; `npm run test:e2e` does both.
        command: 'npx vite preview --port 4173 --strictPort',
        url: 'http://localhost:4173',
        reuseExistingServer: !process.env.CI,
    },
});
