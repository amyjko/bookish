// SvelteKit's browser env module reads its runtime values from a global the
// dev server installs, which doesn't exist under vitest. Static variables
// are inlined at transform time regardless; give the dynamic ones (only the
// optional emulator ports) an empty env.
(globalThis as { __sveltekit_dev?: { env: Record<string, string> } })
    .__sveltekit_dev ??= { env: {} };
