import { expect, test } from 'vitest';
import {
    DEFAULT_SIZE,
    fitWithin,
    mapWithLimit,
    resolveImageURL,
    SIZES,
} from './images';

test('shrinks a landscape image to the width budget', () => {
    expect(fitWithin(2400, 1200, 1200, 1600)).toEqual({
        width: 1200,
        height: 600,
    });
});

test('shrinks a portrait image to the height budget', () => {
    expect(fitWithin(1200, 3200, 1200, 1600)).toEqual({
        width: 600,
        height: 1600,
    });
});

test('never enlarges an image that already fits', () => {
    expect(fitWithin(320, 240, 1200, 1600)).toEqual({
        width: 320,
        height: 240,
    });
});

test('preserves aspect ratio when both dimensions exceed the budget', () => {
    const { width, height } = fitWithin(4000, 3000, 1200, 1600);
    expect(width).toBe(1200);
    expect(height).toBe(900);
    expect(width / height).toBeCloseTo(4000 / 3000, 5);
});

test('never rounds a dimension away to nothing', () => {
    // An extreme panorama would otherwise round its height to 0.
    const { width, height } = fitWithin(10000, 3, 480, 640);
    expect(width).toBeGreaterThan(0);
    expect(height).toBeGreaterThan(0);
});

test('treats a degenerate image as empty rather than dividing by zero', () => {
    expect(fitWithin(0, 0, 1200, 1600)).toEqual({ width: 0, height: 0 });
    expect(fitWithin(-5, 10, 1200, 1600)).toEqual({ width: 0, height: 0 });
});

test('every preset is smaller than the next and shaped for its device', () => {
    const { compact, standard, large } = SIZES;

    expect(compact.maxWidth).toBeLessThan(standard.maxWidth);
    expect(standard.maxWidth).toBeLessThan(large.maxWidth);
    expect(compact.maxHeight).toBeLessThan(standard.maxHeight);
    expect(standard.maxHeight).toBeLessThan(large.maxHeight);

    // Pocket e-ink panels are greyscale; the bigger presets are read on
    // devices that can show color.
    expect(compact.grayscale).toBe(true);
    expect(standard.grayscale).toBe(false);
    expect(large.grayscale).toBe(false);

    for (const size of Object.values(SIZES)) {
        expect(size.quality).toBeGreaterThan(0);
        expect(size.quality).toBeLessThanOrEqual(1);
        expect(size.label.length).toBeGreaterThan(0);
    }
});

test('every preset is keyed by its own id', () => {
    for (const [key, size] of Object.entries(SIZES)) expect(size.id).toBe(key);
});

test('the default is one of the presets', () => {
    expect(SIZES[DEFAULT_SIZE.id]).toBe(DEFAULT_SIZE);
});

// Standard has to cover the common panels at native resolution, or images
// would be upscaled by the device and look worse than the web version.
test('the standard preset covers common e-ink panels at native resolution', () => {
    const { standard } = SIZES;
    for (const [width, height] of [
        [1072, 1448], // Kobo Clara
        [1236, 1648], // Kindle Paperwhite
    ]) {
        const fitted = fitWithin(
            width,
            height,
            standard.maxWidth,
            standard.maxHeight,
        );
        expect(fitted.width).toBeGreaterThanOrEqual(width);
        expect(fitted.height).toBeGreaterThanOrEqual(height);
    }
});

test('resolves a remote image URL unchanged', () => {
    expect(resolveImageURL('https://example.com/a.jpg', '/base')).toBe(
        'https://example.com/a.jpg',
    );
});

// Compiled books are often served from a subdirectory, so a bare `images/x`
// would miss.
test('resolves a local image URL against the book base path', () => {
    expect(resolveImageURL('a.jpg', '/ajko/books/design-methods')).toBe(
        '/ajko/books/design-methods/images/a.jpg',
    );
});

test('resolves a local image URL when the book is at the root', () => {
    expect(resolveImageURL('a.jpg', '')).toBe('/images/a.jpg');
});

test('maps every item, in order, with results aligned to inputs', async () => {
    const items = [1, 2, 3, 4, 5, 6, 7];
    const doubled = await mapWithLimit(items, 3, async (n) => n * 2);
    expect(doubled).toEqual([2, 4, 6, 8, 10, 12, 14]);
});

test('never exceeds the concurrency limit', async () => {
    let running = 0;
    let peak = 0;
    await mapWithLimit(
        Array.from({ length: 20 }, (_, i) => i),
        4,
        async () => {
            running++;
            peak = Math.max(peak, running);
            await new Promise((resolve) => setTimeout(resolve, 1));
            running--;
        },
    );
    expect(peak).toBeLessThanOrEqual(4);
    expect(peak).toBeGreaterThan(1);
});

test('handles fewer items than the limit', async () => {
    expect(await mapWithLimit([1], 8, async (n) => n)).toEqual([1]);
});

test('handles no items at all', async () => {
    expect(await mapWithLimit([], 4, async (n) => n)).toEqual([]);
});
