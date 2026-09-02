import { beforeAll, expect, test, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import { get } from 'svelte/store';
import { tick } from 'svelte';
import EchoRaceHarness from './EchoRaceHarness.svelte';
import { captured } from './capture';
import { installRouteTestShims } from './shims';
import BookSaveStatus from '$lib/models/book/BookSaveStatus';

vi.mock('$app/state', () => ({
    page: {
        route: { id: '/(app)/write/[bookid]/[[editionid=edition]]' },
        params: { bookid: 'testbook' },
        url: new URL('http://localhost/write/testbook'),
    },
}));

vi.mock('$app/navigation', () => ({ goto: () => Promise.resolve() }));

const fakeUser = {
    uid: 'someuser',
    email: 'someone@example.com',
    getIdTokenResult: () => Promise.resolve({ claims: {} }),
};

// A signed-in user so the loaders actually listen.
vi.mock('$lib/models/Firebase', () => ({
    app: undefined,
    auth: {
        onAuthStateChanged: (callback: (user: unknown) => void) => {
            callback(fakeUser);
            return () => undefined;
        },
        signOut: () => Promise.resolve(),
    },
    db: undefined,
    storage: undefined,
    functions: undefined,
}));

/** The edition listener callback EditionLoader registers, captured so the
 *  test can deliver snapshots at chosen moments, like Firestore would. */
const listeners = vi.hoisted(() => ({
    edition: undefined as ((edition: unknown) => void) | undefined,
}));

vi.mock('$lib/models/CRUD', async () => {
    const { makeBook } = await import('./fixtures');
    return {
        listenToPublishedBooks: () => () => undefined,
        listenToEditableBooks: () => () => undefined,
        listenToPartiallyEditableBooks: () => () => undefined,
        listenToBooksByName: (
            _name: string,
            callback: (books: unknown[]) => void,
        ) => {
            queueMicrotask(() => callback([]));
            return () => undefined;
        },
        listenToBookWithID: (
            _id: string,
            callback: (book: unknown) => void,
        ) => {
            queueMicrotask(() => callback(makeBook()));
            return () => undefined;
        },
        listenToEdition: (
            _bookID: string,
            _editionID: string,
            callback: (edition: unknown) => void,
        ) => {
            listeners.edition = callback;
            return () => undefined;
        },
        listenToChapters: (
            _bookID: string,
            _editionID: string,
            callback: (chapters: unknown[]) => void,
        ) => {
            queueMicrotask(() => callback([]));
            return () => undefined;
        },
        getUserEmails: () => Promise.resolve(new Map()),
        createUser: () => Promise.resolve(null),
        createBook: () => Promise.resolve('testbook'),
        createNewEdition: () => Promise.resolve(makeBook()),
        updateLock: () => Promise.resolve(),
        updateEdition: () => Promise.resolve(new Map()),
        updateBook: () => Promise.resolve(),
        isSubdomainAvailable: () => Promise.resolve(true),
        getBookIDWithSubdomain: () => Promise.resolve(null),
        publish: () => Promise.resolve('nope'),
    };
});

beforeAll(installRouteTestShims);

/** Let pending microtask-scheduled effects run. Kept short so the app
 *  layout's 1s save debounce never fires mid-test. */
async function settle() {
    for (let i = 0; i < 10; i++) await tick();
    await new Promise((resolve) => setTimeout(resolve, 25));
}

// Regression test for the lost-update race: a Firestore snapshot (typically
// the echo of a completed save) arriving while newer local edits await their
// own save must not clobber those edits — but snapshots must still apply at
// load time and when no local edits are pending.
test('snapshots apply at load and after saves, but not over pending local edits', async () => {
    const { makeEdition } = await import('./fixtures');

    render(EchoRaceHarness);
    await settle();
    const edition = captured.edition;
    const status = captured.status;
    if (!edition || !status || !listeners.edition)
        throw new Error('harness did not mount loaders');

    // The app layout marks the book Changed as soon as it loads, before any
    // edition snapshot arrives. The first snapshot must be applied anyway:
    // there are no local edits to protect, and nothing would re-deliver it.
    // (A status-only guard deadlocked here, leaving the page loading forever.)
    expect(get(status)).toBe(BookSaveStatus.Changed);
    const original = makeEdition();
    listeners.edition(original);
    await settle();
    expect(get(edition)?.getTitle()).toBe('Test Book');

    // A local edit awaiting its save...
    const edited = get(edition)!.withTitle('Edited Locally');
    edition.set(edited);
    await settle();
    expect(get(status)).toBe(BookSaveStatus.Changed);

    // ...must survive the listener echoing the pre-edit server state.
    listeners.edition(original);
    await settle();
    expect(get(edition)?.getTitle()).toBe('Edited Locally');

    // Once the save completes, snapshots flow again: the save's own
    // confirmation echo...
    status.set(BookSaveStatus.Saved);
    listeners.edition(original.withTitle('Edited Locally'));
    await settle();
    expect(get(edition)?.getTitle()).toBe('Edited Locally');

    // ...and a genuine remote edit, which must not be suppressed just
    // because earlier snapshot applications also set the edition store.
    listeners.edition(original.withTitle('Edited Remotely'));
    await settle();
    expect(get(edition)?.getTitle()).toBe('Edited Remotely');
});
