/**
 * Generates the demo book's images.
 *
 * These are drawn rather than committed as binaries, both to keep the repo
 * light and because each one is chosen to stress a different part of the EPUB
 * image pipeline on a small e-ink screen: fine detail that can smear when
 * downscaled, a tonal ramp that shows banding, extreme aspect ratios that
 * exercise the fit, and transparency that turns black if it isn't matted.
 *
 * PNG is written by hand here so the script needs no image dependency; sharp
 * lives in functions/, not in the app.
 */

import { deflateSync } from 'node:zlib';

const CRC_TABLE = (() => {
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
        let c = i;
        for (let bit = 0; bit < 8; bit++)
            c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        table[i] = c >>> 0;
    }
    return table;
})();

function crc32(bytes) {
    let crc = 0xffffffff;
    for (const byte of bytes)
        crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
    const body = Buffer.concat([Buffer.from(type, 'latin1'), data]);
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body));
    return Buffer.concat([length, body, crc]);
}

/**
 * Encode RGBA pixels as a PNG.
 * @param {number} width
 * @param {number} height
 * @param {Uint8Array} pixels RGBA, 4 bytes per pixel, row major.
 */
export function encodePNG(width, height, pixels) {
    const header = Buffer.alloc(13);
    header.writeUInt32BE(width, 0);
    header.writeUInt32BE(height, 4);
    header[8] = 8; // bit depth
    header[9] = 6; // color type: RGBA
    header[10] = 0; // deflate
    header[11] = 0; // adaptive filtering
    header[12] = 0; // no interlacing

    // Each scanline is prefixed with its filter type; 0 means none.
    const stride = width * 4;
    const raw = Buffer.alloc((stride + 1) * height);
    for (let y = 0; y < height; y++) {
        raw[y * (stride + 1)] = 0;
        Buffer.from(pixels.buffer, pixels.byteOffset + y * stride, stride).copy(
            raw,
            y * (stride + 1) + 1,
        );
    }

    return Buffer.concat([
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        chunk('IHDR', header),
        chunk('IDAT', deflateSync(raw, { level: 9 })),
        chunk('IEND', Buffer.alloc(0)),
    ]);
}

/** Draw an image with a per-pixel function returning [r, g, b, a]. */
function draw(width, height, shade) {
    const pixels = new Uint8Array(width * height * 4);
    for (let y = 0; y < height; y++)
        for (let x = 0; x < width; x++) {
            const [r, g, b, a = 255] = shade(x, y, width, height);
            const i = (y * width + x) * 4;
            pixels[i] = r;
            pixels[i + 1] = g;
            pixels[i + 2] = b;
            pixels[i + 3] = a;
        }
    return encodePNG(width, height, pixels);
}

/** A cover: a broad diagonal wash with a lighter band for the title area. */
function cover() {
    return draw(1400, 2100, (x, y, w, h) => {
        const diagonal = (x / w + y / h) / 2;
        const band = y > h * 0.12 && y < h * 0.4;
        const base = 40 + diagonal * 120;
        return band
            ? [245, 243, 236]
            : [base, base * 0.75 + 20, base * 0.55 + 60];
    });
}

/**
 * A stand-in photograph: smooth gradients with enough high-frequency texture
 * that over-aggressive JPEG quality shows up as mush.
 */
function photograph() {
    return draw(2400, 1600, (x, y, w, h) => {
        const hills = Math.sin(x / 220) * 60 + Math.sin(x / 70) * 18;
        const horizon = h * 0.55 + hills;
        if (y < horizon) {
            const t = y / horizon;
            return [90 + t * 120, 130 + t * 100, 200 - t * 40];
        }
        // Ground: texture from two interfering ripples plus a fine dither.
        const texture =
            Math.sin(x / 9) * Math.cos(y / 11) * 22 + ((x * 7 + y * 13) % 17);
        const depth = (y - horizon) / (h - horizon);
        return [
            70 + depth * 60 + texture,
            95 + depth * 70 + texture,
            60 + depth * 40 + texture,
        ];
    });
}

/**
 * A diagram of thin lines and small type-sized marks. This is the image that
 * reveals whether a preset is too small: at some point the hairlines merge.
 */
function diagram() {
    return draw(1600, 1200, (x, y) => {
        const white = [255, 255, 255];
        const ink = [20, 20, 20];
        // A one pixel grid every 40px, and a heavier one every 200px.
        if (x % 200 === 0 || y % 200 === 0) return [120, 120, 120];
        if (x % 40 === 0 || y % 40 === 0) return [205, 205, 205];
        // Concentric rings, one pixel thick.
        const dx = x - 800;
        const dy = y - 600;
        const radius = Math.sqrt(dx * dx + dy * dy);
        if (Math.abs((radius % 60) - 0) < 1.2) return ink;
        // Diagonal hairlines in one quadrant.
        if (x > 1100 && y < 400 && (x + y) % 6 === 0) return ink;
        // A dashed baseline.
        if (Math.abs(y - 1100) < 2 && x % 12 < 7) return ink;
        return white;
    });
}

/** A stepped grey wedge: e-ink devices show their real tonal range here. */
function wedge() {
    const steps = 16;
    return draw(1600, 400, (x, y, w, h) => {
        if (y > h * 0.75) {
            // A continuous ramp underneath the steps, to reveal banding.
            const v = Math.round((x / w) * 255);
            return [v, v, v];
        }
        const step = Math.min(steps - 1, Math.floor((x / w) * steps));
        const v = Math.round((step / (steps - 1)) * 255);
        return [v, v, v];
    });
}

/** Very tall: the fit has to clamp on height, not width. */
function portrait() {
    return draw(700, 2400, (x, y, w, h) => {
        const t = y / h;
        const stripe = Math.floor(y / 150) % 2 === 0;
        return stripe
            ? [230 - t * 80, 220 - t * 90, 210 - t * 60]
            : [120 + t * 60, 110 + t * 70, 140 + t * 50];
    });
}

/** Very wide: the fit has to clamp on width. */
function panorama() {
    return draw(3000, 600, (x, y, w, h) => {
        const wave = Math.sin(x / 160) * 80 + Math.sin(x / 47) * 25;
        const horizon = h * 0.6 + wave * 0.4;
        return y < horizon
            ? [200 - (y / h) * 60, 210 - (y / h) * 50, 230 - (y / h) * 40]
            : [60 + (y / h) * 40, 90 + (y / h) * 50, 80 + (y / h) * 40];
    });
}

/** Transparency, which becomes black in a JPEG unless it is matted to white. */
function transparent() {
    return draw(900, 900, (x, y, w, h) => {
        const dx = x - w / 2;
        const dy = y - h / 2;
        const radius = Math.sqrt(dx * dx + dy * dy);
        // A ring, fully transparent outside and inside it.
        const inRing = radius > 200 && radius < 380;
        const spokes = Math.abs(Math.sin(Math.atan2(dy, dx) * 6)) > 0.5;
        return inRing && spokes ? [200, 60, 60, 255] : [0, 0, 0, 0];
    });
}

/** An SVG, which the packager passes through rather than rasterizing. */
const LOGO_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 120" width="240" height="120">
  <rect width="240" height="120" fill="#f6f4ee"/>
  <circle cx="60" cy="60" r="34" fill="none" stroke="#222" stroke-width="3"/>
  <path d="M110 90 L140 30 L170 90 Z" fill="none" stroke="#222" stroke-width="3"/>
  <line x1="20" y1="105" x2="220" y2="105" stroke="#888" stroke-width="2"/>
</svg>
`;

/** Every demo image, as { name, contentType, bytes }. */
export function demoImages() {
    return [
        { name: 'cover.png', contentType: 'image/png', bytes: cover() },
        { name: 'photo.png', contentType: 'image/png', bytes: photograph() },
        { name: 'diagram.png', contentType: 'image/png', bytes: diagram() },
        { name: 'wedge.png', contentType: 'image/png', bytes: wedge() },
        { name: 'portrait.png', contentType: 'image/png', bytes: portrait() },
        { name: 'panorama.png', contentType: 'image/png', bytes: panorama() },
        {
            name: 'transparent.png',
            contentType: 'image/png',
            bytes: transparent(),
        },
        {
            name: 'logo.svg',
            contentType: 'image/svg+xml',
            bytes: Buffer.from(LOGO_SVG, 'utf8'),
        },
    ];
}
