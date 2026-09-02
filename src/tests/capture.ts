import type { EditionStore, StatusStore } from '$lib/components/page/Contexts';

/** Filled in by ContextCapture.svelte when a test harness mounts, so tests
 *  can read and write the same context stores the mounted components use. */
export const captured: {
    edition?: EditionStore;
    status?: StatusStore;
} = {};
