import { beforeEach, expect, test, vi } from 'vitest';
import Edition from '../models/book/Edition';
import { buildEPUB, identifierFor } from './build';
import { SIZES } from './images';
import { safeFilename } from './package';

const decoder = new TextDecoder();

/** Read an archive's entries back, so the EPUB is verified by parsing it. */
async function entriesOf(blob: Blob): Promise<Map<string, Uint8Array>> {
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const view = new DataView(bytes.buffer);

    let end = bytes.length - 22;
    while (end >= 0 && view.getUint32(end, true) !== 0x06054b50) end--;
    if (end < 0) throw new Error('No end of central directory record');

    const count = view.getUint16(end + 8, true);
    let offset = view.getUint32(end + 16, true);
    const entries = new Map<string, Uint8Array>();

    for (let i = 0; i < count; i++) {
        const nameLength = view.getUint16(offset + 28, true);
        const extraLength = view.getUint16(offset + 30, true);
        const commentLength = view.getUint16(offset + 32, true);
        const method = view.getUint16(offset + 10, true);
        const local = view.getUint32(offset + 42, true);
        const path = decoder.decode(
            bytes.subarray(offset + 46, offset + 46 + nameLength),
        );

        const localNameLength = view.getUint16(local + 26, true);
        const localExtraLength = view.getUint16(local + 28, true);
        const compressedSize = view.getUint32(local + 18, true);
        const start = local + 30 + localNameLength + localExtraLength;
        const data = bytes.subarray(start, start + compressedSize);

        entries.set(path, method === 0 ? data : await inflate(data));
        offset += 46 + nameLength + extraLength + commentLength;
    }
    return entries;
}

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

function textOf(entries: Map<string, Uint8Array>, path: string): string {
    const bytes = entries.get(path);
    if (bytes === undefined)
        throw new Error(
            `No ${path}; have ${[...entries.keys()].sort().join(', ')}`,
        );
    return decoder.decode(bytes);
}

/** Assert a document is well-formed XML, which EPUB readers require. */
function expectWellFormed(xml: string, what: string) {
    const parsed = new DOMParser().parseFromString(xml, 'application/xml');
    const error = parsed.getElementsByTagName('parsererror')[0];
    expect(
        error?.textContent ?? undefined,
        `${what} is not well-formed XML`,
    ).toBeUndefined();
}

/** A 1x1 GIF, small enough to inline and real enough to fetch. */
const PIXEL = Uint8Array.from([
    0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00,
    0x00, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x21, 0xf9, 0x04, 0x01, 0x00,
    0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00,
    0x00, 0x02, 0x02, 0x44, 0x01, 0x00, 0x3b,
]);

function makeEdition(overrides: Record<string, unknown> = {}) {
    return Edition.fromJSON(undefined, {
        title: 'A Test Book',
        authors: ['Amy J. Ko', 'Someone Else'],
        number: 1,
        summary: '',
        published: Date.UTC(2026, 0, 15),
        images: {},
        description: 'A book for testing.',
        chapters: [],
        license: 'CC BY 4.0',
        acknowledgements: 'Thanks to everyone.',
        tags: ['testing'],
        sources: {},
        references: {},
        symbols: {},
        glossary: {},
        theme: null,
        uids: [],
        ...overrides,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
}

function chapter(
    id: string,
    title: string,
    text: string,
    extra: Record<string, unknown> = {},
) {
    return {
        id,
        title,
        authors: [],
        image: null,
        numbered: true,
        forthcoming: false,
        section: null,
        text,
        uids: [],
        ...extra,
    };
}

beforeEach(() => {
    vi.stubGlobal(
        'fetch',
        vi.fn(async (url: string) =>
            url.includes('missing')
                ? new Response(null, { status: 404 })
                : new Response(PIXEL as BlobPart, {
                      headers: { 'Content-Type': 'image/gif' },
                  }),
        ),
    );
});

async function build(edition: Edition, options = {}) {
    const result = await buildEPUB(edition, {
        modified: new Date(Date.UTC(2026, 0, 1)),
        ...options,
    });
    return { result, entries: await entriesOf(result.blob) };
}

test('produces an archive a reader can identify as an EPUB', async () => {
    const edition = makeEdition({
        chapters: [chapter('one', 'One', 'Hello.')],
    });
    const { result, entries } = await build(edition);

    expect(result.blob.type).toBe('application/epub+zip');
    // The mimetype must be the first entry and stored, uncompressed.
    const bytes = new Uint8Array(await result.blob.arrayBuffer());
    expect(decoder.decode(bytes.subarray(30, 38))).toBe('mimetype');
    expect(textOf(entries, 'mimetype')).toBe('application/epub+zip');
    expect(textOf(entries, 'META-INF/container.xml')).toContain(
        'OEBPS/content.opf',
    );
});

test('every document it writes is well-formed XML', async () => {
    const edition = makeEdition({
        chapters: [
            chapter('one', 'One & Only', 'Hello {a note} <ref> world.'),
            chapter('two', 'Two', '# Header\n\n* A list'),
        ],
        references: { ref: 'Ko, A. (2020). A title. A source.' },
        glossary: {
            bug: { phrase: 'bug', definition: 'A defect', synonyms: ['fault'] },
        },
    });
    const { entries } = await build(edition);

    for (const [path, bytes] of entries)
        if (
            path.endsWith('.xhtml') ||
            path.endsWith('.opf') ||
            path.endsWith('.ncx') ||
            path.endsWith('.xml')
        )
            expectWellFormed(decoder.decode(bytes), path);
});

test('lists chapters in reading order in the package, nav, and ncx', async () => {
    const edition = makeEdition({
        chapters: [
            chapter('one', 'First', 'A.'),
            chapter('two', 'Second', 'B.'),
        ],
    });
    const { entries } = await build(edition);

    const opf = textOf(entries, 'OEBPS/content.opf');
    expect(opf.indexOf('chapter-one')).toBeLessThan(opf.indexOf('chapter-two'));
    expect(opf).toContain('<itemref idref="title"/>');

    const nav = textOf(entries, 'OEBPS/nav.xhtml');
    expect(nav).toContain('>1. First<');
    expect(nav).toContain('>2. Second<');
    expect(nav.indexOf('First')).toBeLessThan(nav.indexOf('Second'));

    // The EPUB 2 fallback older devices still read.
    const ncx = textOf(entries, 'OEBPS/toc.ncx');
    expect(ncx).toContain('one.xhtml');
    expect(ncx).toContain('two.xhtml');
});

test('carries the metadata a reader displays', async () => {
    const edition = makeEdition({
        chapters: [chapter('one', 'One', 'Hi.')],
    });
    const { entries } = await build(edition);
    const opf = textOf(entries, 'OEBPS/content.opf');

    expect(opf).toContain('<dc:title>A Test Book</dc:title>');
    expect(opf).toContain('<dc:creator id="creator-0">Amy J. Ko</dc:creator>');
    expect(opf).toContain(
        '<dc:creator id="creator-1">Someone Else</dc:creator>',
    );
    expect(opf).toContain('<dc:language>en</dc:language>');
    expect(opf).toContain('<dc:rights>CC BY 4.0</dc:rights>');
    expect(opf).toContain('<dc:subject>testing</dc:subject>');
    expect(opf).toContain('2026-01-15');
    // Required by EPUB 3, and must not carry milliseconds.
    expect(opf).toMatch(
        /<meta property="dcterms:modified">\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z<\/meta>/,
    );
});

test('omits forthcoming chapters, as the print view does', async () => {
    const edition = makeEdition({
        chapters: [
            chapter('one', 'Ready', 'Here.'),
            chapter('two', 'Later', '', { forthcoming: true }),
        ],
    });
    const { entries } = await build(edition);

    expect(entries.has('OEBPS/one.xhtml')).toBe(true);
    expect(entries.has('OEBPS/two.xhtml')).toBe(false);
});

test('packages images and points chapters at them', async () => {
    const edition = makeEdition({
        chapters: [chapter('one', 'One', '|photo.jpg|A photo|A caption||')],
    });
    const { result, entries } = await build(edition);

    expect(result.warnings).toEqual([]);
    const chapterXHTML = textOf(entries, 'OEBPS/one.xhtml');
    const source = chapterXHTML.match(/<img src="([^"]+)"/)?.[1];
    expect(source).toBeDefined();
    expect(entries.has(`OEBPS/${source}`)).toBe(true);
    // Everything in the package must also be in the manifest.
    expect(textOf(entries, 'OEBPS/content.opf')).toContain(`href="${source}"`);
});

test('declares a cover both ways, for old and new readers', async () => {
    const edition = makeEdition({
        images: { cover: '|cover.jpg|The cover|||' },
        chapters: [chapter('one', 'One', 'Hi.')],
    });
    const { entries } = await build(edition);

    const opf = textOf(entries, 'OEBPS/content.opf');
    expect(opf).toContain('properties="cover-image"');
    expect(opf).toContain('<meta name="cover"');
    expect(entries.has('OEBPS/cover.xhtml')).toBe(true);
});

test('reports an image it could not fetch and keeps reading', async () => {
    const edition = makeEdition({
        chapters: [
            chapter('one', 'One', '|missing.jpg|Alt|A caption||\n\nAfter.'),
        ],
    });
    const { result, entries } = await build(edition);

    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain('missing.jpg');

    // The chapter still builds, keeping the caption in place of the image.
    const chapterXHTML = textOf(entries, 'OEBPS/one.xhtml');
    expect(chapterXHTML).not.toContain('<img');
    expect(chapterXHTML).toContain('A caption');
    expect(chapterXHTML).toContain('After.');
});

test('resolves local image URLs against the book base path', async () => {
    const edition = makeEdition({
        chapters: [chapter('one', 'One', '|photo.jpg|Alt|||')],
    });
    await build(edition, { base: '/ajko/books/test' });

    expect(fetch).toHaveBeenCalledWith(
        '/ajko/books/test/images/photo.jpg',
        expect.anything(),
    );
});

test('leaves a remote image URL alone', async () => {
    const edition = makeEdition({
        chapters: [chapter('one', 'One', '|https://example.com/p.jpg|Alt|||')],
    });
    await build(edition, { base: '/base' });

    expect(fetch).toHaveBeenCalledWith(
        'https://example.com/p.jpg',
        expect.anything(),
    );
});

test('fetches each distinct image once, however often it appears', async () => {
    const edition = makeEdition({
        chapters: [
            chapter('one', 'One', '|photo.jpg|Alt|||'),
            chapter('two', 'Two', '|photo.jpg|Alt|||'),
        ],
    });
    await build(edition);

    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
});

test('includes references and glossary only when the book has them', async () => {
    const without = await build(
        makeEdition({ chapters: [chapter('one', 'One', 'Hi.')] }),
    );
    expect(without.entries.has('OEBPS/references.xhtml')).toBe(false);
    expect(without.entries.has('OEBPS/glossary.xhtml')).toBe(false);

    const with_ = await build(
        makeEdition({
            chapters: [chapter('one', 'One', 'Hi <ref>. A ~bug~bug.')],
            references: { ref: ['Ko, A.', '2020', 'A title', 'A source', ''] },
            glossary: {
                bug: { phrase: 'bug', definition: 'A defect', synonyms: [] },
            },
        }),
    );
    expect(with_.entries.has('OEBPS/references.xhtml')).toBe(true);
    expect(with_.entries.has('OEBPS/glossary.xhtml')).toBe(true);
});

test('citations and definitions land on anchors that exist', async () => {
    const edition = makeEdition({
        chapters: [chapter('one', 'One', 'Hi <ref>. A ~bug~bug.')],
        references: { ref: ['Ko, A.', '2020', 'A title', 'A source', ''] },
        glossary: {
            bug: { phrase: 'bug', definition: 'A defect', synonyms: [] },
        },
    });
    const { entries } = await build(edition);

    expect(textOf(entries, 'OEBPS/one.xhtml')).toContain(
        'references.xhtml#ref-ref',
    );
    expect(textOf(entries, 'OEBPS/references.xhtml')).toContain('id="ref-ref"');

    expect(textOf(entries, 'OEBPS/one.xhtml')).toContain(
        'glossary.xhtml#gloss-bug',
    );
    // The web glossary omits these ids; here they have to resolve.
    expect(textOf(entries, 'OEBPS/glossary.xhtml')).toContain('id="gloss-bug"');
});

test('a footnote and its endnote link to each other', async () => {
    const edition = makeEdition({
        chapters: [chapter('one', 'One', 'Text{the note}.')],
    });
    const { entries } = await build(edition);
    const xhtml = textOf(entries, 'OEBPS/one.xhtml');

    expect(xhtml).toContain('href="#fn-0"');
    expect(xhtml).toContain('id="fn-0"');
    expect(xhtml).toContain('href="#fnref-0"');
    expect(xhtml).toContain('id="fnref-0"');
    expect(xhtml).toContain('the note');
});

test('a smaller preset produces a smaller file', async () => {
    const edition = makeEdition({
        chapters: [chapter('one', 'One', 'Text.')],
    });
    const standard = await build(edition, { size: SIZES.standard });
    const compact = await build(edition, { size: SIZES.compact });

    // No images here, so this only confirms the preset threads through without
    // changing the text; the e2e test checks actual re-encoding in a browser.
    expect(compact.result.blob.size).toBeLessThanOrEqual(
        standard.result.blob.size,
    );
});

test('reports progress through every phase', async () => {
    const edition = makeEdition({
        chapters: [
            chapter('one', 'One', '|photo.jpg|Alt|||'),
            chapter('two', 'Two', 'B.'),
        ],
    });
    const progress: string[] = [];
    await build(edition, {
        onProgress: (p: { phase: string; done: number; total: number }) =>
            progress.push(`${p.phase} ${p.done}/${p.total}`),
    });

    expect(progress).toContain('images 1/1');
    expect(progress).toContain('chapters 1/2');
    expect(progress).toContain('chapters 2/2');
    expect(progress).toContain('packaging 1/1');
});

test('names the file after the book', async () => {
    const { result } = await build(
        makeEdition({
            title: 'Cooperative Software Development!',
            chapters: [chapter('one', 'One', 'Hi.')],
        }),
    );
    expect(result.filename).toBe('cooperative-software-development.epub');
});

test('makes a usable filename out of an awkward title', () => {
    expect(safeFilename('A: Book / With <Punctuation>')).toBe(
        'a-book-with-punctuation',
    );
    expect(safeFilename('   ')).toBe('book');
    expect(safeFilename('Ünïcodé Títle')).toBe('ünïcodé-títle');
});

test('gives the same edition the same identifier every time', () => {
    const edition = makeEdition();
    expect(identifierFor(edition)).toBe(identifierFor(edition));
    expect(identifierFor(edition)).toContain('urn:bookish:');
});

test('builds a book with no chapters at all', async () => {
    const { entries, result } = await build(makeEdition());
    expect(result.warnings).toEqual([]);
    expect(entries.has('OEBPS/title.xhtml')).toBe(true);
    expectWellFormed(textOf(entries, 'OEBPS/content.opf'), 'content.opf');
});

test('puts the title, license and acknowledgements on the title page', async () => {
    const { entries } = await build(
        makeEdition({ chapters: [chapter('one', 'One', 'Hi.')] }),
    );
    const title = textOf(entries, 'OEBPS/title.xhtml');

    expect(title).toContain('A Test Book');
    expect(title).toContain('Amy J. Ko');
    expect(title).toContain('A book for testing.');
    expect(title).toContain('Thanks to everyone.');
    expect(title).toContain('CC BY 4.0');
});

test('every spine item is present in the archive', async () => {
    const edition = makeEdition({
        images: { cover: '|cover.jpg|The cover|||' },
        chapters: [chapter('one', 'One', 'Hi <ref>.')],
        references: { ref: ['Ko, A.', '2020', 'T', 'S', ''] },
    });
    const { entries } = await build(edition);
    const opf = textOf(entries, 'OEBPS/content.opf');

    // Every manifest href must resolve to a real entry, or readers error.
    for (const match of opf.matchAll(/href="([^"]+)"/g))
        expect(
            entries.has(`OEBPS/${match[1]}`),
            `manifest lists ${match[1]} but it is not in the archive`,
        ).toBe(true);
});

test('every image fetch carries a timeout', async () => {
    // Books link images on hosts nobody controls. A host that accepts the
    // connection and then never answers used to hang the whole export: fetches
    // run a few at a time, so the dead ones block everything behind them and
    // the progress indicator sits there forever. A failed or timed-out fetch is
    // reported and dropped like any other, which the 404 case above covers.
    const edition = makeEdition({
        chapters: [chapter('one', 'One', '|photo.jpg|Alt|||')],
    });
    await build(edition);

    const options = vi.mocked(fetch).mock.calls[0]?.[1] as
        { signal?: AbortSignal } | undefined;
    expect(options?.signal, 'the image fetch has no timeout').toBeInstanceOf(
        AbortSignal,
    );
});

test('a reference whose fields are not strings still exports', async () => {
    // Real books predate the current types: years are often integers and URLs
    // are often null, though Reference declares both as strings. One stale
    // field used to throw partway through and lose the entire export.
    const edition = makeEdition({
        chapters: [chapter('one', 'One', 'A claim<old>.')],
        references: {
            // year as a number, url as null, summary missing.
            old: ['Plato', -370, 'The Republic', 'Athens', null],
        },
    });
    const { result, entries } = await build(edition);

    expect(result.blob.size).toBeGreaterThan(0);
    const references = textOf(entries, 'OEBPS/references.xhtml');
    expect(references).toContain('Plato');
    expect(references).toContain('-370');
    expect(references).toContain('The Republic');
});
