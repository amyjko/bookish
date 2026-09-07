/**
 * Assembles the documents that make up an EPUB 3 package.
 *
 * Nothing here touches the network or the DOM, so it can be unit tested and is
 * safe to import during server rendering.
 */

import type Edition from '../models/book/Edition';
import type Chapter from '../models/book/Chapter';
import Reference from '../models/book/Reference';
import FormatNode from '../models/chapter/FormatNode';
import Parser from '../models/chapter/Parser';
import {
    chapterPath,
    document_,
    endnoteSection,
    escapeAttribute,
    escapeText,
    serializeChapter,
    serializeFormat,
    type SerializationContext,
} from './xhtml';

export const MIMETYPE = 'application/epub+zip';

/** Where the package's documents live inside the archive. */
export const CONTENT_DIRECTORY = 'OEBPS';

export const CONTAINER = `<?xml version="1.0" encoding="utf-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
<rootfiles>
<rootfile full-path="${CONTENT_DIRECTORY}/content.opf" media-type="application/oebps-package+xml"/>
</rootfiles>
</container>`;

/**
 * A deliberately plain stylesheet.
 *
 * The book's own theme is not carried across: it imports Google Fonts an
 * offline reader can't fetch, and encodes color an e-ink panel can't show.
 * Readers set their own font and size on these devices, and overriding that is
 * the single most common way an EPUB becomes unpleasant to read. So this sets
 * layout and rhythm only, in relative units, and leaves typeface and size alone.
 */
export const STYLESHEET = `body { margin: 0 5%; line-height: 1.5; widows: 2; orphans: 2; }

h1, h2, h3, h4, h5, h6 { line-height: 1.2; page-break-after: avoid; break-after: avoid; }
h1 { margin: 2em 0 1em; }

p { margin: 0; text-indent: 1.2em; }
/* The first paragraph of a section is not a continuation, so it isn't indented. */
p.first, h1 + p, h2 + p, h3 + p, h4 + p, blockquote p:first-child, li > p:first-child { text-indent: 0; }

.chapter-number { display: block; margin-bottom: 0.5em; text-transform: uppercase; letter-spacing: 0.1em; font-size: 0.8em; }
.section-name { display: block; font-style: italic; }
.authors { font-style: italic; }

figure { margin: 1.5em 0; text-align: center; page-break-inside: avoid; break-inside: avoid; }
figure img { max-width: 100%; }
figcaption { font-size: 0.85em; text-align: left; margin-top: 0.5em; }
.credit { display: block; font-style: italic; }
.missing-image figcaption { text-align: center; font-style: italic; }

blockquote { margin: 1.5em 2em; font-style: italic; }
blockquote p { text-indent: 0; }
cite { font-style: normal; font-size: 0.85em; }

.callout { margin: 1.5em 1em; padding-left: 1em; border-left: 3px solid currentColor; }
.callout p { text-indent: 0; }

pre { font-size: 0.8em; white-space: pre-wrap; overflow-wrap: break-word; margin: 1.5em 0; }
code { font-size: 0.9em; }

table { border-collapse: collapse; margin: 1.5em auto; font-size: 0.9em; }
th, td { border: 1px solid currentColor; padding: 0.3em 0.5em; text-align: left; }
caption { font-size: 0.85em; margin-bottom: 0.5em; }

ul, ol { margin: 1em 0; padding-left: 1.5em; }

hr { border: 0; border-top: 1px solid currentColor; margin: 2em auto; width: 30%; }

.citation, .noteref { font-size: 0.75em; }
.notes { margin-top: 3em; font-size: 0.9em; page-break-before: always; break-before: page; }
.note p { text-indent: 0; margin-bottom: 0.5em; }

.reference, .definition-entry { margin-bottom: 0.8em; }
dt { font-weight: bold; margin-top: 1em; }
dd { margin-left: 1em; }
.synonyms { font-size: 0.85em; font-style: italic; }
`;

/** One document in the package. */
export type Document = {
    /** Path relative to the content directory. */
    path: string;
    /** Manifest id. */
    id: string;
    content: string;
    /** Title as it should appear in the navigation, or undefined to omit it. */
    navTitle?: string;
};

/** An image that made it into the package. */
export type PackagedImage = {
    path: string;
    id: string;
    mediaType: string;
    bytes: Uint8Array;
    /** True for the book's cover image. */
    cover?: boolean;
};

/** Chapters that get their own document, in reading order. */
export function includedChapters(edition: Edition): Chapter[] {
    // Forthcoming chapters have no text to include, matching the print view.
    return edition.getChapters().filter((chapter) => !chapter.isForthcoming());
}

/** Turn a title into something usable as a filename. */
export function safeFilename(title: string): string {
    const cleaned = title
        .replace(/[^\p{L}\p{N}]+/gu, '-')
        .replace(/^-+|-+$/g, '')
        .toLowerCase();
    return cleaned.length > 0 ? cleaned.slice(0, 80) : 'book';
}

/** The plain-text form of a Bookdown string, for metadata. */
function text(edition: Edition, bookdown: string): string {
    return Parser.parseFormat(edition, bookdown).toText().trim();
}

/** The title page, which carries the metadata a reader wants up front. */
export function titleDocument(
    edition: Edition,
    context: SerializationContext,
): Document {
    const title = edition.getTitle();
    const authors = edition.getAuthors();
    const description = edition.getDescription();
    const acknowledgements = edition.getAcknowledgements();
    const license = edition.getLicense();

    const body = `<section class="title-page" epub:type="titlepage">
<h1>${escapeText(title)}</h1>
${
    authors.length > 0
        ? `<p class="authors">${authors
              .map((author) =>
                  serializeFormat(Parser.parseFormat(edition, author), context),
              )
              .join(', ')}</p>`
        : ''
}
<p class="edition">${escapeText(edition.getEditionLabel())} edition</p>
${
    description.trim().length > 0
        ? `<p class="description">${serializeFormat(
              Parser.parseFormat(edition, description),
              context,
          )}</p>`
        : ''
}
${
    acknowledgements.trim().length > 0
        ? `<section class="acknowledgements"><h2>${escapeText(
              edition.getHeader('acknowledgements'),
          )}</h2><p>${serializeFormat(
              Parser.parseFormat(edition, acknowledgements),
              context,
          )}</p></section>`
        : ''
}
${
    license.trim().length > 0
        ? `<section class="license"><h2>${escapeText(
              edition.getHeader('license'),
          )}</h2><p>${serializeFormat(
              Parser.parseFormat(edition, license),
              context,
          )}</p></section>`
        : ''
}
</section>`;

    return {
        path: 'title.xhtml',
        id: 'title',
        content: document_(title, body),
        navTitle: 'Title Page',
    };
}

/** A page that displays the cover image, which some readers expect. */
export function coverDocument(imagePath: string): Document {
    return {
        path: 'cover.xhtml',
        id: 'cover',
        content: document_(
            'Cover',
            `<section epub:type="cover" class="cover"><figure><img src="${escapeAttribute(
                imagePath,
            )}" alt="Cover"/></figure></section>`,
        ),
    };
}

/** One chapter, with its footnotes gathered into endnotes at the end. */
export function chapterDocument(
    edition: Edition,
    chapter: Chapter,
    context: SerializationContext,
): Document | undefined {
    const ast = chapter.getAST(edition);
    if (ast === undefined) return undefined;

    const { body, endnotes } = serializeChapter(ast, context);
    const number = edition.getChapterNumber(chapter.getID());
    const section = chapter.getSection();
    const authors = chapter.getAuthors();

    const header = `<header>
${
    number !== undefined
        ? `<span class="chapter-number">Chapter ${number}</span>`
        : ''
}
<h1>${escapeText(chapter.getTitle())}</h1>
${section ? `<span class="section-name">${escapeText(section)}</span>` : ''}
${
    authors.length > 0
        ? `<p class="authors">${authors
              .map((author) =>
                  serializeFormat(Parser.parseFormat(edition, author), context),
              )
              .join(', ')}</p>`
        : ''
}
</header>`;

    return {
        path: chapterPath(chapter.getID()),
        id: `chapter-${chapter.getID()}`,
        content: document_(
            chapter.getTitle(),
            `${header}\n${body}\n${endnoteSection(endnotes)}`,
        ),
        navTitle:
            number !== undefined
                ? `${number}. ${chapter.getTitle()}`
                : chapter.getTitle(),
    };
}

/** Render a reference the way the web reader's Reference.svelte does. */
function referenceContent(
    reference: Reference | FormatNode,
    context: SerializationContext,
): string {
    if (reference instanceof FormatNode)
        return serializeFormat(reference, context);

    const title = escapeText(reference.title);
    // The web reader omits the period when the title already ends in one.
    const period = reference.title.trim().endsWith('?') ? '' : '.';
    return `${escapeText(reference.authors)} (${escapeText(reference.year)}). ${
        reference.url
            ? `<a href="${escapeAttribute(reference.url)}">${title}</a>`
            : title
    }${period} <em>${escapeText(reference.source)}</em>${
        reference.summary ? ` ${escapeText(reference.summary)}` : ''
    }`;
}

/** The references back matter, whose anchors the citations link to. */
export function referencesDocument(
    edition: Edition,
    context: SerializationContext,
): Document | undefined {
    const references = edition.getReferences();
    const ids = Object.keys(references).sort();
    if (ids.length === 0) return undefined;

    const header = edition.getHeader('references');
    const body = `<section epub:type="bibliography">
<h1>${escapeText(header)}</h1>
${ids
    .map(
        (id) =>
            `<p class="reference" id="ref-${escapeAttribute(
                id,
            )}">${referenceContent(references[id], context)}</p>`,
    )
    .join('\n')}
</section>`;

    return {
        path: 'references.xhtml',
        id: 'references',
        content: document_(header, body),
        navTitle: header,
    };
}

/** The glossary back matter, whose anchors the definitions link to. */
export function glossaryDocument(
    edition: Edition,
    context: SerializationContext,
): Document | undefined {
    const glossary = edition.getGlossary();
    const ids = Object.keys(glossary).sort((a, b) =>
        glossary[a].phrase.localeCompare(glossary[b].phrase),
    );
    if (ids.length === 0) return undefined;

    const header = edition.getHeader('glossary');
    const body = `<section epub:type="glossary">
<h1>${escapeText(header)}</h1>
<dl>
${ids
    .map((id) => {
        const entry = glossary[id];
        const synonyms = entry.synonyms ?? [];
        // The web glossary renders no id, so its anchors don't resolve; here
        // they must, because every definition in the text links to one.
        return `<dt id="gloss-${escapeAttribute(id)}">${escapeText(
            entry.phrase,
        )}</dt><dd>${serializeFormat(
            Parser.parseFormat(edition, entry.definition),
            context,
        )}${
            synonyms.length > 0
                ? `<p class="synonyms">${escapeText(synonyms.join(', '))}</p>`
                : ''
        }</dd>`;
    })
    .join('\n')}
</dl>
</section>`;

    return {
        path: 'glossary.xhtml',
        id: 'glossary',
        content: document_(header, body),
        navTitle: header,
    };
}

/** The EPUB 3 navigation document. */
export function navigationDocument(documents: Document[]): Document {
    const listed = documents.filter((d) => d.navTitle !== undefined);
    const body = `<nav epub:type="toc" id="toc">
<h1>Contents</h1>
<ol>
${listed
    .map(
        (d) =>
            `<li><a href="${escapeAttribute(d.path)}">${escapeText(
                d.navTitle as string,
            )}</a></li>`,
    )
    .join('\n')}
</ol>
</nav>`;
    return {
        path: 'nav.xhtml',
        id: 'nav',
        content: document_('Contents', body),
    };
}

/**
 * The EPUB 2 navigation document. Superseded by nav.xhtml, but older Kindle and
 * Kobo firmware still looks for it, and it costs a few hundred bytes.
 */
export function ncxDocument(
    identifier: string,
    title: string,
    documents: Document[],
): string {
    const listed = documents.filter((d) => d.navTitle !== undefined);
    return `<?xml version="1.0" encoding="utf-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
<head>
<meta name="dtb:uid" content="${escapeAttribute(identifier)}"/>
<meta name="dtb:depth" content="1"/>
<meta name="dtb:totalPageCount" content="0"/>
<meta name="dtb:maxPageNumber" content="0"/>
</head>
<docTitle><text>${escapeText(title)}</text></docTitle>
<navMap>
${listed
    .map(
        (d, index) =>
            `<navPoint id="nav-${index}" playOrder="${index + 1}">
<navLabel><text>${escapeText(d.navTitle as string)}</text></navLabel>
<content src="${escapeAttribute(d.path)}"/>
</navPoint>`,
    )
    .join('\n')}
</navMap>
</ncx>`;
}

/** The package document: metadata, manifest, and reading order. */
export function packageDocument(
    edition: Edition,
    identifier: string,
    documents: Document[],
    images: PackagedImage[],
    modified: Date,
): string {
    const cover = images.find((image) => image.cover);
    const authors = edition.getAuthors().map((a) => text(edition, a));
    const published = edition.published;

    const metadata = [
        `<dc:identifier id="pub-id">${escapeText(identifier)}</dc:identifier>`,
        `<dc:title>${escapeText(edition.getTitle())}</dc:title>`,
        // The edition model has no language field, so this is a fixed guess.
        `<dc:language>en</dc:language>`,
        ...authors.map(
            (author, index) =>
                `<dc:creator id="creator-${index}">${escapeText(
                    author,
                )}</dc:creator>`,
        ),
        published !== null
            ? `<dc:date>${new Date(published).toISOString()}</dc:date>`
            : '',
        edition.getLicense().trim().length > 0
            ? `<dc:rights>${escapeText(
                  text(edition, edition.getLicense()),
              )}</dc:rights>`
            : '',
        edition.getDescription().trim().length > 0
            ? `<dc:description>${escapeText(
                  text(edition, edition.getDescription()),
              )}</dc:description>`
            : '',
        ...edition
            .getTags()
            .map((tag) => `<dc:subject>${escapeText(tag)}</dc:subject>`),
        // Required by EPUB 3, and must not carry milliseconds.
        `<meta property="dcterms:modified">${modified
            .toISOString()
            .replace(/\.\d{3}Z$/, 'Z')}</meta>`,
        // The legacy way to declare a cover, which EPUB 2 readers look for.
        cover ? `<meta name="cover" content="${cover.id}"/>` : '',
    ]
        .filter((line) => line.length > 0)
        .join('\n');

    const manifest = [
        `<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>`,
        `<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>`,
        `<item id="style" href="style.css" media-type="text/css"/>`,
        ...documents
            .filter((d) => d.id !== 'nav')
            .map(
                (d) =>
                    `<item id="${escapeAttribute(
                        d.id,
                    )}" href="${escapeAttribute(
                        d.path,
                    )}" media-type="application/xhtml+xml"/>`,
            ),
        ...images.map(
            (image) =>
                `<item id="${escapeAttribute(
                    image.id,
                )}" href="${escapeAttribute(
                    image.path,
                )}" media-type="${escapeAttribute(image.mediaType)}"${
                    image.cover ? ' properties="cover-image"' : ''
                }/>`,
        ),
    ].join('\n');

    const spine = documents
        .filter((d) => d.id !== 'nav')
        .map((d) => `<itemref idref="${escapeAttribute(d.id)}"/>`)
        .join('\n');

    return `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="pub-id">
<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
${metadata}
</metadata>
<manifest>
${manifest}
</manifest>
<spine toc="ncx">
${spine}
</spine>
</package>`;
}
