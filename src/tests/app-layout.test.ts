import { beforeAll, expect, test, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import { tick } from 'svelte';
import Book from '$lib/models/book/Book';
import Edition from '$lib/models/book/Edition';
import type { DocumentReference } from 'firebase/firestore';
import AppLayoutHarness from './AppLayoutHarness.svelte';

// The app layout pulls in Firebase-backed modules and SvelteKit runtime
// state; stub the parts that talk to the network.
vi.mock('$app/state', () => ({
    page: {
        route: { id: '/(app)/write/[bookid]' },
        params: {},
        url: new URL('http://localhost/write'),
    },
}));

vi.mock('$app/navigation', () => ({ goto: () => Promise.resolve() }));

vi.mock('$lib/models/CRUD', () => ({
    getUserEmails: () => Promise.resolve(new Map()),
    updateBook: () => Promise.resolve(),
    updateEdition: () => Promise.resolve(new Map()),
    updateLock: () => Promise.resolve(),
}));

// Auth only renders its children once onAuthStateChanged has reported, so
// the fake auth must call back immediately — otherwise the layout renders
// nothing and this test would pass without exercising anything.
vi.mock('$lib/models/Firebase', () => ({
    app: undefined,
    auth: {
        onAuthStateChanged: (callback: (user: unknown) => void) => {
            callback({ uid: 'someuser' });
            return () => undefined;
        },
        signOut: () => Promise.resolve(),
    },
    db: undefined,
    storage: undefined,
    functions: undefined,
}));

beforeAll(() => {
    // jsdom implements neither of these; Svelte's slide transition (used by
    // the editor toolbar) calls element.animate.
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
});

function makeBook() {
    return Book.fromJSON('testbook', {
        title: 'Test Book',
        authors: [],
        description: '',
        cover: null,
        published: false,
        editions: [],
        domain: null,
        uids: ['someuser'],
        readuids: [],
    });
}

function makeEdition() {
    const bookRef = {
        id: 'testbook',
        path: 'books/testbook',
    } as unknown as DocumentReference;
    return new Edition(
        bookRef,
        undefined,
        [],
        'Test Book',
        [],
        1,
        '',
        null,
        {},
        undefined,
        '',
        [],
        'All rights reserved.',
        '',
        [],
        {},
        {},
        {},
        {},
        null,
        null,
        {},
        null,
    );
}

// Regression test: the layout's save/debounce effects read and write internal
// bookkeeping (the debounce timer, the last-saved edition). If those are
// declared as $state, each effect invalidates itself and Svelte throws
// effect_update_depth_exceeded, which blanks every editor page.
test('setting a book does not cause an effect update cycle', async () => {
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
        screen = render(AppLayoutHarness, { props: { book: makeBook() } });
        await tick();
        await new Promise((resolve) => setTimeout(resolve, 50));
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

    // Guard against the test silently passing without exercising the layout:
    // the probe must have mounted inside it and set the book.
    expect(screen?.getByTestId('probe').textContent).toBe('book set');
});

// Coverage (not a proven regression) for the edition save path, which has the
// same shape: the effect compares the current edition against
// previousSavedEdition, and saving writes that variable back. That path
// happens to settle on its own today, so this passes either way; it exists to
// catch a future cycle introduced around scheduleSave/saveEdition.
test('setting an edition does not cause an effect update cycle', async () => {
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
        screen = render(AppLayoutHarness, {
            props: { book: makeBook(), edition: makeEdition() },
        });
        await tick();
        await new Promise((resolve) => setTimeout(resolve, 50));
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
    expect(screen?.getByTestId('probe').textContent).toBe('book set');
});
