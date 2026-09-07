/**
 * Builds a complete EPUB from a loaded edition, entirely in the browser.
 *
 * No server is involved: the whole book's text is already in memory by the time
 * the table of contents renders, and images are fetched directly (Firebase's
 * download URLs allow cross-origin reads, and compiled books serve theirs from
 * the same origin).
 */

import type Edition from '../models/book/Edition';
import EmbedNode from '../models/chapter/EmbedNode';
import Parser from '../models/chapter/Parser';
import Zip from './zip';
import {
    DEFAULT_SIZE,
    mapWithLimit,
    prepareImage,
    resolveImageURL,
    type ImageSize,
} from './images';
import {
    CONTAINER,
    CONTENT_DIRECTORY,
    MIMETYPE,
    STYLESHEET,
    chapterDocument,
    coverDocument,
    glossaryDocument,
    includedChapters,
    navigationDocument,
    ncxDocument,
    packageDocument,
    referencesDocument,
    safeFilename,
    titleDocument,
    type Document,
    type PackagedImage,
} from './package';
import { chapterPath, type SerializationContext } from './xhtml';

/** How many images to fetch at once. */
const IMAGE_CONCURRENCY = 4;

export type BuildPhase = 'images' | 'chapters' | 'packaging';

export type BuildProgress = {
    phase: BuildPhase;
    done: number;
    total: number;
};

export type BuildResult = {
    blob: Blob;
    filename: string;
    /** Images that couldn't be included, so the reader knows what's missing. */
    warnings: string[];
};

export type BuildOptions = {
    /** The book's base path, for resolving local image URLs. */
    base?: string;
    size?: ImageSize;
    onProgress?: (progress: BuildProgress) => void;
    /** Fixed timestamp, so tests can compare output. */
    modified?: Date;
};

/**
 * A stable, unique identifier for this edition. EPUB requires one, and readers
 * use it to recognize the same book across downloads.
 */
export function identifierFor(edition: Edition): string {
    const book = edition.getBookRef()?.id;
    const version = edition.getEditionRef()?.id ?? edition.getEditionNumber();
    return book === undefined
        ? `urn:bookish:${safeFilename(edition.getTitle())}:${version}`
        : `urn:bookish:${book}:${version}`;
}

/** Build an EPUB for the given edition. */
export async function buildEPUB(
    edition: Edition,
    options: BuildOptions = {},
): Promise<BuildResult> {
    const {
        base = '',
        size = DEFAULT_SIZE,
        onProgress,
        modified = new Date(),
    } = options;

    const warnings: string[] = [];
    const chapters = includedChapters(edition);

    // Collect every distinct image the book uses. getEmbeds walks the cover,
    // each chapter's cover, chapter bodies, and the back matter covers.
    const coverEmbed = parseCover(edition);
    const embeds = new Map<string, EmbedNode>();
    if (coverEmbed) embeds.set(coverEmbed.getURL(), coverEmbed);
    for (const { embed } of edition.getEmbeds())
        // Videos are links in the package, not files, and an embed with no URL
        // is an empty placeholder the author hasn't filled in yet.
        if (!embed.isVideo() && embed.getURL().trim().length > 0)
            if (!embeds.has(embed.getURL())) embeds.set(embed.getURL(), embed);

    const urls = [...embeds.keys()];
    onProgress?.({ phase: 'images', done: 0, total: urls.length });

    let fetched = 0;
    const prepared = await mapWithLimit(
        urls,
        IMAGE_CONCURRENCY,
        async (url) => {
            const image = await prepareImage(resolveImageURL(url, base), size);
            onProgress?.({
                phase: 'images',
                done: ++fetched,
                total: urls.length,
            });
            return { url, image };
        },
    );

    // Map each embed URL to its path inside the package.
    const images: PackagedImage[] = [];
    const imagePaths = new Map<string, string>();
    const coverURL = coverEmbed?.getURL();
    for (const { url, image } of prepared) {
        if (image === undefined) {
            warnings.push(url);
            continue;
        }
        const index = images.length;
        const path = `images/${index}.${image.extension}`;
        imagePaths.set(url, path);
        images.push({
            path,
            id: `image-${index}`,
            mediaType: image.mediaType,
            bytes: image.bytes,
            cover: url === coverURL,
        });
    }

    const context: SerializationContext = {
        edition,
        images: imagePaths,
        chapters: new Set(chapters.map((chapter) => chapter.getID())),
    };

    // Front matter, chapters, then back matter, which is also the reading order.
    onProgress?.({ phase: 'chapters', done: 0, total: chapters.length });

    const documents: Document[] = [];
    const coverPath = coverURL ? imagePaths.get(coverURL) : undefined;
    if (coverPath !== undefined) documents.push(coverDocument(coverPath));
    documents.push(titleDocument(edition, context));

    let written = 0;
    for (const chapter of chapters) {
        const document = chapterDocument(edition, chapter, context);
        if (document !== undefined) documents.push(document);
        onProgress?.({
            phase: 'chapters',
            done: ++written,
            total: chapters.length,
        });
    }

    const references = referencesDocument(edition, context);
    if (references !== undefined) documents.push(references);
    const glossary = glossaryDocument(edition, context);
    if (glossary !== undefined) documents.push(glossary);

    onProgress?.({ phase: 'packaging', done: 0, total: 1 });

    const navigation = navigationDocument(documents);
    const identifier = identifierFor(edition);

    const zip = new Zip(modified);
    // The mimetype must be first and uncompressed so readers can identify the
    // file by reading a fixed range of bytes at its head.
    zip.add('mimetype', MIMETYPE, true);
    zip.add('META-INF/container.xml', CONTAINER);

    const content = (path: string) => `${CONTENT_DIRECTORY}/${path}`;
    zip.add(
        content('content.opf'),
        packageDocument(edition, identifier, documents, images, modified),
    );
    zip.add(
        content('toc.ncx'),
        ncxDocument(identifier, edition.getTitle(), documents),
    );
    zip.add(content(navigation.path), navigation.content);
    zip.add(content('style.css'), STYLESHEET);
    for (const document of documents)
        zip.add(content(document.path), document.content);
    // Images are already compressed; deflating them again costs time and saves
    // nothing, so they are stored.
    for (const image of images) zip.add(content(image.path), image.bytes, true);

    const blob = await zip.toBlob(MIMETYPE);
    onProgress?.({ phase: 'packaging', done: 1, total: 1 });

    return {
        blob,
        filename: `${safeFilename(edition.getTitle())}.epub`,
        warnings,
    };
}

/** The cover embed, if the edition has one. */
function parseCover(edition: Edition): EmbedNode | undefined {
    const cover = edition.getImage('cover');
    if (cover === null) return undefined;
    const node = Parser.parseEmbed(edition, cover);
    return node instanceof EmbedNode && node.getURL().trim().length > 0
        ? node
        : undefined;
}

export { chapterPath };
