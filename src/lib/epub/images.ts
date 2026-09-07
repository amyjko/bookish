/**
 * Fetches a book's images and shrinks them to something an e-reader can hold.
 *
 * Books are written for the web, where a full resolution photograph is fine.
 * E-ink devices are small, slow, and often storage constrained, so every image
 * is re-encoded to fit the reader's chosen budget. The server-side thumbnails
 * are no help here: they are 320px wide, below even the smallest preset.
 *
 * Every canvas reference lives inside a function rather than at module scope,
 * because this module is imported during server rendering and during
 * bookish-reader's prerender pass, and Node has no OffscreenCanvas.
 */

/** A reader-selectable image budget. */
export type ImageSize = {
    /** Identifier used in the UI and persisted nowhere. */
    id: string;
    /** What the reader sees in the size menu. */
    label: string;
    maxWidth: number;
    maxHeight: number;
    /** JPEG quality, 0 to 1. */
    quality: number;
    /** Whether to discard color. E-ink panels below ~1000px are greyscale. */
    grayscale: boolean;
};

/**
 * The presets offered to readers. Standard covers the common 6-7" e-ink panels
 * at native resolution (Kobo Clara 1072x1448, Kindle Paperwhite 1236x1648);
 * Compact targets pocket-sized greyscale readers; Large leaves room to zoom
 * into diagrams on a tablet.
 */
export const SIZES: Record<string, ImageSize> = {
    compact: {
        id: 'compact',
        label: 'Compact — small e-ink readers',
        maxWidth: 480,
        maxHeight: 640,
        quality: 0.7,
        grayscale: true,
    },
    standard: {
        id: 'standard',
        label: 'Standard — most e-readers',
        // Just above the Kindle Paperwhite's 1236x1648, so a full-page image is
        // never scaled down here only to be scaled back up by the device.
        maxWidth: 1280,
        maxHeight: 1720,
        quality: 0.8,
        grayscale: false,
    },
    large: {
        id: 'large',
        label: 'Large — tablets and zooming',
        maxWidth: 1600,
        maxHeight: 2200,
        quality: 0.85,
        grayscale: false,
    },
};

export const DEFAULT_SIZE = SIZES.standard;

/**
 * The dimensions an image should be drawn at to fit within a budget, preserving
 * its aspect ratio. Never enlarges: an image already smaller than the budget is
 * left at its own size.
 */
export function fitWithin(
    width: number,
    height: number,
    maxWidth: number,
    maxHeight: number,
): { width: number; height: number } {
    if (width <= 0 || height <= 0) return { width: 0, height: 0 };
    const scale = Math.min(maxWidth / width, maxHeight / height, 1);
    return {
        width: Math.max(1, Math.round(width * scale)),
        height: Math.max(1, Math.round(height * scale)),
    };
}

/** A packaged image, ready to be added to the archive. */
export type PreparedImage = {
    bytes: Uint8Array;
    /** The extension to give it in the package, without a dot. */
    extension: string;
    mediaType: string;
};

/** Media types EPUB 3 requires every reading system to support. */
const PASS_THROUGH: Record<string, { extension: string }> = {
    'image/jpeg': { extension: 'jpg' },
    'image/png': { extension: 'png' },
    'image/gif': { extension: 'gif' },
    'image/svg+xml': { extension: 'svg' },
    'image/webp': { extension: 'webp' },
};

function passThrough(bytes: Uint8Array, mediaType: string): PreparedImage {
    const known = PASS_THROUGH[mediaType];
    return known === undefined
        ? { bytes, extension: 'jpg', mediaType: 'image/jpeg' }
        : { bytes, extension: known.extension, mediaType };
}

/**
 * Resolve an embed's URL to something fetchable. Local (non-http) URLs are
 * relative to the book's base path, exactly as Embed.svelte resolves them --
 * and in compiled books that base is frequently non-empty, so a bare
 * `images/x.jpg` would 404.
 */
export function resolveImageURL(url: string, base: string): string {
    return url.startsWith('http') ? url : `${base}/images/${url}`;
}

/**
 * Fetch an image and re-encode it to fit the given budget.
 *
 * Returns undefined for anything that can't be fetched or decoded, which is a
 * real possibility: authors may link images on hosts that send no CORS headers.
 * Callers report those as warnings and drop the image, keeping its caption.
 */
export async function prepareImage(
    url: string,
    size: ImageSize,
): Promise<PreparedImage | undefined> {
    let bytes: Uint8Array;
    let mediaType: string;
    try {
        const response = await fetch(url);
        if (!response.ok) return undefined;
        const blob = await response.blob();
        bytes = new Uint8Array(await blob.arrayBuffer());
        mediaType = blob.type || 'image/jpeg';
    } catch {
        return undefined;
    }

    if (bytes.length === 0) return undefined;

    // SVG is resolution independent and usually tiny; rasterizing it is both
    // wasteful and unreliable across browsers.
    if (mediaType === 'image/svg+xml') return passThrough(bytes, mediaType);

    const reencoded = await reencode(bytes, mediaType, size);
    // Keep whichever is smaller: re-encoding an already-small PNG can inflate
    // it, and the point of the exercise is a smaller file.
    return reencoded !== undefined && reencoded.bytes.length < bytes.length
        ? reencoded
        : passThrough(bytes, mediaType);
}

/**
 * Draw the image at its budgeted size and encode it as JPEG. Returns undefined
 * if the platform lacks the canvas APIs or the bytes don't decode.
 */
async function reencode(
    bytes: Uint8Array,
    mediaType: string,
    size: ImageSize,
): Promise<PreparedImage | undefined> {
    if (
        typeof createImageBitmap === 'undefined' ||
        typeof document === 'undefined'
    )
        return undefined;

    let bitmap: ImageBitmap;
    try {
        bitmap = await createImageBitmap(
            new Blob([bytes as BlobPart], { type: mediaType }),
        );
    } catch {
        return undefined;
    }

    try {
        const { width, height } = fitWithin(
            bitmap.width,
            bitmap.height,
            size.maxWidth,
            size.maxHeight,
        );
        if (width === 0 || height === 0) return undefined;

        const canvas = makeCanvas(width, height);
        const context = canvas.getContext('2d') as
            CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
        if (context === null) return undefined;

        // White underneath, so transparency doesn't become black in a JPEG.
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, width, height);
        context.drawImage(bitmap, 0, 0, width, height);

        if (size.grayscale) desaturate(context, width, height);

        const blob = await toBlob(canvas, size.quality);
        if (blob === null) return undefined;

        return {
            bytes: new Uint8Array(await blob.arrayBuffer()),
            extension: 'jpg',
            mediaType: 'image/jpeg',
        };
    } catch {
        return undefined;
    } finally {
        bitmap.close();
    }
}

function makeCanvas(
    width: number,
    height: number,
): OffscreenCanvas | HTMLCanvasElement {
    if (typeof OffscreenCanvas !== 'undefined')
        return new OffscreenCanvas(width, height);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
}

function toBlob(
    canvas: OffscreenCanvas | HTMLCanvasElement,
    quality: number,
): Promise<Blob | null> {
    return 'convertToBlob' in canvas
        ? canvas.convertToBlob({ type: 'image/jpeg', quality })
        : new Promise((resolve) =>
              canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality),
          );
}

/** Replace each pixel with its luminance, weighted the way human vision is. */
function desaturate(
    context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    width: number,
    height: number,
) {
    const image = context.getImageData(0, 0, width, height);
    const pixels = image.data;
    for (let i = 0; i < pixels.length; i += 4) {
        const luminance =
            0.2126 * pixels[i] +
            0.7152 * pixels[i + 1] +
            0.0722 * pixels[i + 2];
        pixels[i] = luminance;
        pixels[i + 1] = luminance;
        pixels[i + 2] = luminance;
    }
    context.putImageData(image, 0, 0);
}

/**
 * Run tasks with a bounded number in flight, so a book with a hundred images
 * doesn't open a hundred connections at once.
 */
export async function mapWithLimit<In, Out>(
    items: In[],
    limit: number,
    map: (item: In, index: number) => Promise<Out>,
): Promise<Out[]> {
    const results = new Array<Out>(items.length);
    let next = 0;
    const workers = Array.from(
        { length: Math.min(limit, items.length) },
        async () => {
            for (;;) {
                const index = next++;
                if (index >= items.length) return;
                results[index] = await map(items[index], index);
            }
        },
    );
    await Promise.all(workers);
    return results;
}
