/**
 * A minimal ZIP writer, sufficient for EPUB and dependency-free.
 *
 * EPUB requires that the first entry in the archive be an uncompressed
 * `mimetype` file, which most convenience wrappers don't expose, so we write
 * the format directly. Only the pieces EPUB needs are implemented: no Zip64
 * (books are nowhere near 4GB), no encryption, no directory entries.
 *
 * Everything here is portable between the browser and Node, so it can be unit
 * tested and is safe to import during server rendering. `CompressionStream` is
 * used when available and entries fall back to stored otherwise.
 */

const LOCAL_HEADER = 0x04034b50;
const CENTRAL_HEADER = 0x02014b50;
const END_OF_CENTRAL_DIRECTORY = 0x06054b50;

/** Deflated, per the ZIP spec's compression method field. */
const DEFLATED = 8;
/** Stored (no compression). */
const STORED = 0;

/** Bit 11 of the general purpose flags declares the filename to be UTF-8. */
const UTF8_NAMES = 0x0800;

const CRC_TABLE = makeCRCTable();

function makeCRCTable(): Uint32Array {
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
        let c = i;
        for (let bit = 0; bit < 8; bit++)
            c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        table[i] = c >>> 0;
    }
    return table;
}

/** The CRC-32 of the given bytes, as the ZIP spec defines it. */
export function crc32(bytes: Uint8Array): number {
    let crc = 0xffffffff;
    for (let i = 0; i < bytes.length; i++)
        crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
}

/**
 * Compress with raw DEFLATE, or return undefined if the platform can't.
 *
 * The bytes are pushed through the stream directly rather than via
 * `Blob.stream()`, which keeps this working everywhere web streams exist --
 * including jsdom, whose Blob has no `stream()`.
 */
async function deflate(bytes: Uint8Array): Promise<Uint8Array | undefined> {
    if (typeof CompressionStream === 'undefined') return undefined;
    try {
        const stream = new CompressionStream('deflate-raw');
        // Typed explicitly: a bare Uint8Array is generic over its buffer, and
        // the DOM types require one that is not shared.
        const writer =
            stream.writable.getWriter() as WritableStreamDefaultWriter<Uint8Array>;
        // Deliberately not awaited before reading: a large chunk can exceed the
        // stream's queue, and the write only settles once the reader drains it.
        const written = writer.write(bytes).then(() => writer.close());

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

        const deflated = new Uint8Array(length);
        let offset = 0;
        for (const chunk of chunks) {
            deflated.set(chunk, offset);
            offset += chunk.length;
        }
        return deflated;
    } catch {
        // A platform with the constructor but without 'deflate-raw'.
        return undefined;
    }
}

/**
 * DOS date and time, which is what ZIP stores. Seconds have two-second
 * resolution and years are relative to 1980; both are the format's, not ours.
 */
function dosDateTime(date: Date): { date: number; time: number } {
    return {
        date:
            (Math.max(0, date.getFullYear() - 1980) << 9) |
            ((date.getMonth() + 1) << 5) |
            date.getDate(),
        time:
            (date.getHours() << 11) |
            (date.getMinutes() << 5) |
            (date.getSeconds() >> 1),
    };
}

type Entry = {
    name: Uint8Array;
    data: Uint8Array;
    crc: number;
    size: number;
    method: number;
    offset: number;
};

export default class Zip {
    readonly #encoder = new TextEncoder();
    readonly #pending: {
        path: string;
        bytes: Uint8Array;
        store: boolean;
    }[] = [];
    readonly #modified: Date;

    /**
     * @param modified the timestamp recorded for every entry. Defaults to now;
     * tests pass a fixed date so output is byte-for-byte reproducible.
     */
    constructor(modified: Date = new Date()) {
        this.#modified = modified;
    }

    /**
     * Queue a file. Entries are written in the order added, which is how the
     * EPUB `mimetype` requirement is met: add it first, stored.
     *
     * @param store true to skip compression. Pass it for `mimetype` (required)
     * and for already-compressed payloads like JPEGs, where deflating costs
     * time and saves nothing.
     */
    add(path: string, bytes: Uint8Array | string, store = false) {
        this.#pending.push({
            path,
            bytes:
                typeof bytes === 'string' ? this.#encoder.encode(bytes) : bytes,
            store,
        });
    }

    /** The number of files queued. */
    get size() {
        return this.#pending.length;
    }

    /** Assemble the archive. */
    async toBlob(type = 'application/zip'): Promise<Blob> {
        const { date, time } = dosDateTime(this.#modified);
        const entries: Entry[] = [];
        const parts: Uint8Array[] = [];
        let offset = 0;

        for (const { path, bytes, store } of this.#pending) {
            const name = this.#encoder.encode(path);
            const compressed = store ? undefined : await deflate(bytes);
            // Only take the compressed form if it actually helped.
            const useDeflate =
                compressed !== undefined && compressed.length < bytes.length;
            const data = useDeflate ? (compressed as Uint8Array) : bytes;

            const entry: Entry = {
                name,
                data,
                crc: crc32(bytes),
                size: bytes.length,
                method: useDeflate ? DEFLATED : STORED,
                offset,
            };
            entries.push(entry);

            const header = new Uint8Array(30 + name.length);
            const view = new DataView(header.buffer);
            view.setUint32(0, LOCAL_HEADER, true);
            view.setUint16(4, 20, true); // version needed
            view.setUint16(6, UTF8_NAMES, true);
            view.setUint16(8, entry.method, true);
            view.setUint16(10, time, true);
            view.setUint16(12, date, true);
            view.setUint32(14, entry.crc, true);
            view.setUint32(18, data.length, true); // compressed size
            view.setUint32(22, entry.size, true); // uncompressed size
            view.setUint16(26, name.length, true);
            view.setUint16(28, 0, true); // extra field length
            header.set(name, 30);

            parts.push(header, data);
            offset += header.length + data.length;
        }

        const directoryOffset = offset;
        for (const entry of entries) {
            const header = new Uint8Array(46 + entry.name.length);
            const view = new DataView(header.buffer);
            view.setUint32(0, CENTRAL_HEADER, true);
            view.setUint16(4, 20, true); // version made by
            view.setUint16(6, 20, true); // version needed
            view.setUint16(8, UTF8_NAMES, true);
            view.setUint16(10, entry.method, true);
            view.setUint16(12, time, true);
            view.setUint16(14, date, true);
            view.setUint32(16, entry.crc, true);
            view.setUint32(20, entry.data.length, true);
            view.setUint32(24, entry.size, true);
            view.setUint16(28, entry.name.length, true);
            view.setUint16(30, 0, true); // extra field length
            view.setUint16(32, 0, true); // comment length
            view.setUint16(34, 0, true); // disk number
            view.setUint16(36, 0, true); // internal attributes
            view.setUint32(38, 0, true); // external attributes
            view.setUint32(42, entry.offset, true);
            header.set(entry.name, 46);

            parts.push(header);
            offset += header.length;
        }

        const end = new Uint8Array(22);
        const endView = new DataView(end.buffer);
        endView.setUint32(0, END_OF_CENTRAL_DIRECTORY, true);
        endView.setUint16(4, 0, true); // disk number
        endView.setUint16(6, 0, true); // disk with directory
        endView.setUint16(8, entries.length, true);
        endView.setUint16(10, entries.length, true);
        endView.setUint32(12, offset - directoryOffset, true);
        endView.setUint32(16, directoryOffset, true);
        endView.setUint16(20, 0, true); // comment length
        parts.push(end);

        return new Blob(parts as BlobPart[], { type });
    }
}
