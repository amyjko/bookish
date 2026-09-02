import { vi } from 'vitest';

// SvelteKit's dynamic public env module reads runtime state that doesn't
// exist under vitest; give every suite an empty env instead.
vi.mock('$env/dynamic/public', () => ({ env: {} }));
