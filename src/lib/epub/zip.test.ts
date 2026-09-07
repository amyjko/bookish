import { expect, test } from 'vitest';
import Zip, { crc32 } from './zip';

const decoder = new TextDecoder();

/**
 * A minimal ZIP reader, so the writer's output is verified by parsing it back
 * rather than by asserting on bytes we'd have to keep in sync by hand.
 */
function read(bytes: Uint8Array) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

    // Find the end of central directory record, which is last.
    let end = bytes.length - 22;
    while (end >= 0 && view.getUint32(end, true) !== 0x06054b50) end--;
    if (end < 0) throw new Error('No end of central directory record');

    const count = view.getUint16(end + 8, true);
    let offset = view.getUint32(end + 16, true);

    const entries: {
        path: string;
        method: number;
        crc: number;
        size: number;
        offset: number;
    }[] = [];
    for (let i = 0; i < count; i++) {
        if (view.getUint32(offset, true) !== 0x02014b50)
            throw new Error(`Bad central header at ${offset}`);
        const nameLength = view.getUint16(offset + 28, true);
        const extraLength = view.getUint16(offset + 30, true);
        const commentLength = view.getUint16(offset + 32, true);
        entries.push({
            method: view.getUint16(offset + 10, true),
            crc: view.getUint32(offset + 16, true),
            size: view.getUint32(offset + 24, true),
            offset: view.getUint32(offset + 42, true),
            path: decoder.decode(
                bytes.subarray(offset + 46, offset + 46 + nameLength),
            ),
        });
        offset += 46 + nameLength + extraLength + commentLength;
    }
    return { entries, view, bytes };
}

/** Read one entry's bytes, inflating if necessary. */
async function contentOf(
    archive: ReturnType<typeof read>,
    path: string,
): Promise<Uint8Array> {
    const entry = archive.entries.find((e) => e.path === path);
    if (entry === undefined) throw new Error(`No entry ${path}`);

    const { view, bytes } = archive;
    if (view.getUint32(entry.offset, true) !== 0x04034b50)
        throw new Error(`Bad local header for ${path}`);
    const nameLength = view.getUint16(entry.offset + 26, true);
    const extraLength = view.getUint16(entry.offset + 28, true);
    const compressedSize = view.getUint32(entry.offset + 18, true);
    const start = entry.offset + 30 + nameLength + extraLength;
    const data = bytes.subarray(start, start + compressedSize);

    if (entry.method === 0) return data;
    return inflate(data);
}

/** Raw DEFLATE decompression, avoiding Blob.stream(), which jsdom lacks. */
async function inflate(data: Uint8Array): Promise<Uint8Array> {
    const stream = new DecompressionStream('deflate-raw');
    const writer =
        stream.writable.getWriter() as WritableStreamDefaultWriter<Uint8Array>;
    const written = writer.write(data).then(() => writer.close());

    const reader = stream.readable.getReader();
    const chunks: Uint8Array[] = [];
    let length = 0;
    for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        length += value.length;
    }
    await written;

    const out = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {
        out.set(chunk, offset);
        offset += chunk.length;
    }
    return out;
}

async function archiveOf(zip: Zip) {
    return read(new Uint8Array(await (await zip.toBlob()).arrayBuffer()));
}

// The check value published in the zlib and PNG specifications.
test('crc32 matches the specification check value', () => {
    expect(crc32(new TextEncoder().encode('123456789'))).toBe(0xcbf43926);
});

test('crc32 of nothing is zero', () => {
    expect(crc32(new Uint8Array(0))).toBe(0);
});

test('round trips text and binary content', async () => {
    const binary = new Uint8Array([0, 1, 2, 253, 254, 255]);
    const zip = new Zip();
    zip.add('hello.txt', 'Hello, world!');
    zip.add('nested/deep/bytes.bin', binary);

    const archive = await archiveOf(zip);
    expect(archive.entries.map((e) => e.path)).toEqual([
        'hello.txt',
        'nested/deep/bytes.bin',
    ]);
    expect(decoder.decode(await contentOf(archive, 'hello.txt'))).toBe(
        'Hello, world!',
    );
    expect(await contentOf(archive, 'nested/deep/bytes.bin')).toEqual(binary);
});

test('round trips content that compresses well', async () => {
    // Long enough that deflate definitely beats storing it.
    const text = 'the quick brown fox '.repeat(500);
    const zip = new Zip();
    zip.add('repetitive.txt', text);

    const archive = await archiveOf(zip);
    expect(archive.entries[0].method).toBe(8);
    expect(decoder.decode(await contentOf(archive, 'repetitive.txt'))).toBe(
        text,
    );
});

test('stores rather than deflates when compression would not help', async () => {
    const zip = new Zip();
    // Incompressible: a short string has more deflate overhead than savings.
    zip.add('tiny.txt', 'x');

    const archive = await archiveOf(zip);
    expect(archive.entries[0].method).toBe(0);
});

test('honors an explicit request to store', async () => {
    const text = 'the quick brown fox '.repeat(500);
    const zip = new Zip();
    zip.add('repetitive.txt', text, true);

    const archive = await archiveOf(zip);
    expect(archive.entries[0].method).toBe(0);
    expect(archive.entries[0].size).toBe(text.length);
});

test('records the uncompressed size and CRC of the original bytes', async () => {
    const text = 'the quick brown fox '.repeat(500);
    const zip = new Zip();
    zip.add('repetitive.txt', text);

    const archive = await archiveOf(zip);
    expect(archive.entries[0].size).toBe(text.length);
    expect(archive.entries[0].crc).toBe(crc32(new TextEncoder().encode(text)));
});

test('encodes non-ASCII paths and content as UTF-8', async () => {
    const path = 'café/章.txt';
    const content = 'Hello, 世界!';
    const zip = new Zip();
    zip.add(path, content);

    const archive = await archiveOf(zip);
    expect(archive.entries[0].path).toBe(path);
    expect(decoder.decode(await contentOf(archive, path))).toBe(content);
});

// This is the constraint that makes a hand-rolled writer worth having: EPUB
// requires `mimetype` to be the first entry and to be stored, so that readers
// can identify the file by reading a fixed byte range at its head.
test('an EPUB-shaped archive puts a stored mimetype first', async () => {
    const zip = new Zip();
    zip.add('mimetype', 'application/epub+zip', true);
    zip.add('META-INF/container.xml', '<container/>');

    const blob = await zip.toBlob('application/epub+zip');
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const archive = read(bytes);

    expect(archive.entries[0].path).toBe('mimetype');
    expect(archive.entries[0].method).toBe(0);
    expect(archive.entries[0].offset).toBe(0);
    // Signature, then the name at 30, then the stored content right after it.
    expect(decoder.decode(bytes.subarray(0, 2))).toBe('PK');
    expect(decoder.decode(bytes.subarray(30, 38))).toBe('mimetype');
    expect(decoder.decode(bytes.subarray(38, 58))).toBe('application/epub+zip');
});

test('an empty archive is still a valid one', async () => {
    const archive = await archiveOf(new Zip());
    expect(archive.entries).toEqual([]);
});

test('output is reproducible for a fixed timestamp', async () => {
    const build = async () => {
        const zip = new Zip(new Date(2026, 0, 1, 12, 0, 0));
        zip.add('mimetype', 'application/epub+zip', true);
        zip.add('a.txt', 'content');
        return new Uint8Array(await (await zip.toBlob()).arrayBuffer());
    };
    expect(await build()).toEqual(await build());
});
