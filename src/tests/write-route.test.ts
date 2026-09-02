import { beforeAll, expect, test, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import { tick } from 'svelte';
import WriteRouteHarness from './WriteRouteHarness.svelte';

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

// Book/edition builders are shared with other suites.
// Firestore delivers snapshots asynchronously; queueMicrotask mimics that
// while keeping callbacks re-invocable like real listeners.
vi.mock('$lib/models/CRUD', async () => {
    const { makeBook, makeEdition } = await import('./fixtures');
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
            queueMicrotask(() => callback(makeEdition()));
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

// Svelte 5 schedules effect flushes through queueMicrotask. A cycle that
// spans a store write and a re-render churns microtasks forever, which
// hangs the process rather than tripping Svelte's synchronous depth guard.
// Capping microtasks turns such a hang into a fast, loud failure.
let microtasks = 0;
beforeAll(() => {
    const original = globalThis.queueMicrotask.bind(globalThis);
    globalThis.queueMicrotask = (fn: () => void) => {
        if (++microtasks > 200000)
            throw new Error(
                'effect cycle suspected: microtask budget exceeded',
            );
        original(fn);
    };

    // jsdom implements none of these browser APIs.
    Element.prototype.animate ??= (() => ({
        cancel: () => undefined,
        finished: Promise.resolve(),
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
    })) as unknown as Element['animate'];
    window.matchMedia = ((query: string) => ({
        matches: false,
        media: query,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
    })) as unknown as typeof window.matchMedia;
    globalThis.IntersectionObserver ??= class {
        observe() {}
        unobserve() {}
        disconnect() {}
        takeRecords() {
            return [];
        }
    } as unknown as typeof IntersectionObserver;
    globalThis.ResizeObserver ??= class {
        observe() {}
        unobserve() {}
        disconnect() {}
    } as unknown as typeof ResizeObserver;
    if (!('fonts' in document))
        Object.defineProperty(document, 'fonts', {
            value: { ready: Promise.resolve() },
        });
});

// Regression test for the /write/[bookid] route: mounts the real app layout,
// book and edition loaders, and table of contents, with listener callbacks
// delivered like Firestore snapshots. Any effect cycle anywhere in the tree
// throws effect_update_depth_exceeded and fails this test.
test('the write route loads a book and edition without effect cycles', async () => {
    const errors: string[] = [];
    const originalError = console.error;
    console.error = (...args: unknown[]) => {
        errors.push(args.map((a) => String(a)).join(' '));
    };
    const onError = (event: ErrorEvent | PromiseRejectionEvent) => {
        const value = 'reason' in event ? event.reason : event.error;
        errors.push(String((value as Error)?.message ?? value));
    };
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onError);

    let screen;
    try {
        screen = render(WriteRouteHarness);
        // Let the microtask-delivered snapshots and resulting effects settle.
        for (let i = 0; i < 10; i++) await tick();
        await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
        errors.push(String((error as Error)?.message ?? error));
    } finally {
        console.error = originalError;
        window.removeEventListener('error', onError);
        window.removeEventListener('unhandledrejection', onError);
    }

    expect(
        errors.filter((e) => e.includes('effect_update_depth_exceeded')),
    ).toEqual([]);

    // The table of contents must actually have rendered the edition's chapter;
    // this both guards against a hang (spinner forever) and against this test
    // going vacuous.
    expect(screen?.container.textContent).toContain('Chapter One');
});
