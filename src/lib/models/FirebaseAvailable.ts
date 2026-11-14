import { PUBLIC_READER } from '$app/env/public';

/**
 * Whether this build talks to Firebase. A bound book (bookish-reader) never
 * does, and the Firebase SDK is most of its JavaScript, so it must never load
 * it. Anything a reader page can reach should therefore import Firebase.ts,
 * CRUD.ts and the firebase/* packages only with a dynamic import() behind this
 * check, or behind an action only an editor can take. Type-only imports are
 * fine. src/tests/firebase-free.test.ts enforces this.
 */
export const usesFirebase = PUBLIC_READER !== 'true';
