/** Browser APIs the app layout tree needs that jsdom doesn't implement,
 *  plus a microtask budget that turns effect cycles into fast failures.
 *  Call from a suite's beforeAll before rendering route harnesses. */
export function installRouteTestShims() {
    // Svelte 5 schedules effect flushes through queueMicrotask. A cycle that
    // spans a store write and a re-render churns microtasks forever, which
    // hangs the process rather than tripping Svelte's synchronous depth guard.
    // Capping microtasks turns such a hang into a fast, loud failure.
    let microtasks = 0;
    const original = globalThis.queueMicrotask.bind(globalThis);
    globalThis.queueMicrotask = (fn: () => void) => {
        if (++microtasks > 200000)
            throw new Error(
                'effect cycle suspected: microtask budget exceeded',
            );
        original(fn);
    };

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
}
