import { expect, test } from 'vitest';
import Parser from '../models/chapter/Parser';
import Edition from '../models/book/Edition';
import {
    STYLESHEET,
    chapterDocument,
    coverDocument,
    glossaryDocument,
    navigationDocument,
    referencesDocument,
    titleDocument,
} from './package';
import {
    document_,
    endnoteSection,
    serializeChapter,
    type SerializationContext,
} from './xhtml';

/**
 * The packaged stylesheet has to assume the reading system supplies nothing.
 * Small e-readers often have almost no default stylesheet, so anything left
 * unsaid is left unrendered: headings came out all one size, ordered lists came
 * out bulleted, and a definition list ran together into one paragraph on an
 * XTeink X3 until this was covered.
 */

function makeEdition(
    options: {
        references?: Record<string, string | string[]>;
        glossary?: Record<
            string,
            { phrase: string; definition: string; synonyms: string[] }
        >;
    } = {},
) {
    return Edition.fromJSON(undefined, {
        title: 'Test',
        authors: [],
        number: 1,
        summary: '',
        published: null,
        images: {},
        description: '',
        chapters: [
            {
                id: 'sample',
                title: 'Sample',
                authors: ['An Author'],
                image: null,
                numbered: true,
                forthcoming: false,
                section: 'A Section',
                text: EVERYTHING,
                uids: [],
            },
        ],
        license: '',
        acknowledgements: '',
        tags: [],
        sources: {},
        references: options.references ?? {},
        symbols: {},
        glossary: options.glossary ?? {},
        theme: null,
        uids: [],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
}

/** Bookdown exercising every construct the serializer can render. */
const EVERYTHING = `:label A paragraph with *bold*, _italic_, ^sup^, ^vsub^, \`code\`js and a [link|https://example.com].

# Header one

## Header two

### Header three

#### Header four

* A bullet

* Another bullet

A paragraph, because the parser merges adjacent lists into one.

1. Numbered

2. Also numbered

\`python
print(1)
\`A code caption

"
A quotation.
"Someone

=
A callout.
=

,Head A|Head B
,Cell one|Cell two
A table caption

|photo.jpg|Alt text|A caption|A credit|

-

A footnote{a note}, a citation<ref>, and a ~term~gloss.`;

/**
 * Every element name the packager can put into an EPUB: the chapter serializer
 * plus each of the standalone documents. The glossary's definition list only
 * comes from the last of those, which is exactly where the device bug was.
 */
function emittedElements(): Set<string> {
    const edition = makeEdition({
        references: { ref: 'A reference.' },
        glossary: {
            gloss: { phrase: 'term', definition: 'A meaning', synonyms: ['x'] },
        },
    });
    const context: SerializationContext = {
        edition,
        images: new Map([['photo.jpg', 'images/0.jpg']]),
        chapters: new Set(['other']),
    };
    const { body, endnotes } = serializeChapter(
        Parser.parseChapter(edition, EVERYTHING),
        context,
    );

    const documents = [
        // The whole document, so the head and body wrappers are covered too.
        document_('Title', body + endnoteSection(endnotes)),
        // The chapter document adds the header block around that body.
        chapterDocument(edition, edition.getChapters()[0], context)?.content,
        titleDocument(edition, context).content,
        coverDocument('images/0.jpg').content,
        referencesDocument(edition, context)?.content,
        glossaryDocument(edition, context)?.content,
        navigationDocument([titleDocument(edition, context)]).content,
    ].filter((content) => content !== undefined);

    const elements = new Set<string>();
    for (const content of documents)
        for (const match of content.matchAll(/<([a-zA-Z][a-zA-Z0-9]*)[\s/>]/g))
            elements.add(match[1].toLowerCase());
    return elements;
}

/** Elements that are inline or structural, so they need no display rule. */
const NO_DISPLAY_RULE_NEEDED = new Set([
    // Document structure, styled by the reading system's chrome.
    'html',
    'head',
    'body',
    'title',
    'meta',
    'link',
    // Genuinely inline.
    'a',
    'span',
    'strong',
    'em',
    'sup',
    'sub',
    'code',
    'cite',
    'br',
    'img',
]);

/** Whether the stylesheet gives an element an explicit display. */
function hasDisplayRule(element: string): boolean {
    // Match the element as a whole selector token in any rule that sets display.
    for (const [, selectors, body] of STYLESHEET.matchAll(
        /([^{}]+)\{([^}]*)\}/g,
    )) {
        if (!/(^|[;\s])display\s*:/.test(body)) continue;
        const tokens = selectors
            .split(',')
            .map((selector) => selector.trim().split(/\s+/).pop() ?? '');
        if (tokens.includes(element)) return true;
    }
    return false;
}

test('every element the serializer emits has an explicit display', () => {
    const missing = [...emittedElements()]
        .filter((element) => !NO_DISPLAY_RULE_NEEDED.has(element))
        .filter((element) => !hasDisplayRule(element))
        .sort();
    expect(
        missing,
        `these elements would render inline on a reader with no default stylesheet: ${missing.join(', ')}`,
    ).toEqual([]);
});

test('the fixture really does exercise the elements that broke on a device', () => {
    // Guards the test above: if the fixture stopped emitting these, it would
    // pass while covering nothing.
    const emitted = emittedElements();
    for (const element of [
        'dl',
        'dt',
        'dd',
        'table',
        'thead',
        'tbody',
        'tr',
        'th',
        'td',
        'caption',
        'figure',
        'figcaption',
        'section',
        'aside',
        'header',
        'ol',
        'ul',
        'li',
        'pre',
        'code',
        'h1',
        'h2',
    ])
        expect(emitted, `fixture no longer emits ${element}`).toContain(
            element,
        );
});

test('headings are given distinct, decreasing sizes', () => {
    const sizes = [1, 2, 3, 4, 5, 6].map((level) => {
        const match = STYLESHEET.match(
            new RegExp(`(^|\\n)h${level}\\s*\\{[^}]*font-size:\\s*([\\d.]+)em`),
        );
        expect(match, `h${level} has no font-size`).not.toBeNull();
        return Number(match?.[2]);
    });
    // Strictly decreasing, so levels are distinguishable.
    for (let i = 1; i < sizes.length; i++)
        expect(sizes[i], `h${i + 1} is not smaller than h${i}`).toBeLessThan(
            sizes[i - 1],
        );
    // Relative units only, so the reader's chosen base size still governs.
    expect(STYLESHEET).not.toMatch(/font-size:\s*\d+(px|pt)/);
});

test('code is monospace, and it is the only family the stylesheet sets', () => {
    expect(STYLESHEET).toMatch(/pre[^{}]*\{[^}]*font-family:\s*monospace/);
    // Prose keeps whatever the reader chose.
    const families = [...STYLESHEET.matchAll(/font-family:\s*([^;]+);/g)].map(
        (match) => match[1].trim(),
    );
    expect(families).toEqual(families.map(() => 'monospace'));
});

test('ordered lists are numbered and unordered ones are not', () => {
    expect(STYLESHEET).toMatch(/(^|\n)ol\s*\{[^}]*list-style-type:\s*decimal/);
    expect(STYLESHEET).toMatch(/(^|\n)ul\s*\{[^}]*list-style-type:\s*disc/);
});

test('list markers sit outside, so wrapped items hang', () => {
    expect(STYLESHEET).toMatch(/list-style-position:\s*outside/);
});

test('a definition term and its definition are separate blocks', () => {
    for (const element of ['dt', 'dd'])
        expect(hasDisplayRule(element), `${element} has no display`).toBe(true);
    expect(STYLESHEET).toMatch(/(^|\n)dt\s*\{[^}]*font-weight:\s*bold/);
    // Space beneath each definition, so entries don't run together.
    expect(STYLESHEET).toMatch(/(^|\n)dd\s*\{[^}]*margin/);
});
