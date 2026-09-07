import { expect, test } from 'vitest';
import Parser from '../models/chapter/Parser';
import Edition from '../models/book/Edition';
import {
    document_,
    endnoteSection,
    escapeAttribute,
    escapeText,
    serializeChapter,
    type SerializationContext,
} from './xhtml';

/** An edition with just enough in it to resolve references and definitions. */
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
        chapters: [],
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

function context(
    overrides: Partial<SerializationContext> = {},
): SerializationContext {
    return {
        edition: makeEdition(),
        images: new Map(),
        chapters: new Set(),
        ...overrides,
    };
}

/** Serialize Bookdown to chapter body markup. */
function html(bookdown: string, ctx: SerializationContext = context()) {
    return serializeChapter(Parser.parseChapter(ctx.edition, bookdown), ctx)
        .body;
}

/** Parse as XML and return the parse error, if any. This is the property that
 *  actually matters: EPUB readers reject documents that are not well-formed. */
function xmlErrorIn(xhtml: string): string | undefined {
    const parsed = new DOMParser().parseFromString(
        xhtml,
        'application/xhtml+xml',
    );
    const error = parsed.getElementsByTagName('parsererror')[0];
    return error ? (error.textContent ?? 'parse error') : undefined;
}

test.each([
    ['Hello.', '<p>Hello.</p>'],
    ['# A header', '<h2 id="header-0">A header</h2>'],
    ['## Deeper', '<h3 id="header-0">Deeper</h3>'],
    ['*bold*', '<p><strong>bold</strong></p>'],
    ['_italic_', '<p><em>italic</em></p>'],
    ['^super^', '<p><sup>super</sup></p>'],
    ['^vsub^', '<p><sub>sub</sub></p>'],
    ['-', '<hr/>'],
    ['* One\n\n* Two', '<ul><li>One</li><li>Two</li></ul>'],
    ['1. One\n\n2. Two', '<ol><li>One</li><li>Two</li></ol>'],
    ['`code`python', '<p><code>code</code></p>'],
    [
        '[label|https://example.com]',
        '<p><a href="https://example.com">label</a></p>',
    ],
])('%s serializes to %s', (bookdown: string, expected: string) => {
    expect(html(bookdown)).toBe(expected);
});

test('escapes text content, every occurrence', () => {
    expect(escapeText('a < b & c > d & e')).toBe(
        'a &lt; b &amp; c &gt; d &amp; e',
    );
});

test('escapes ampersands before the escapes it introduces', () => {
    // The bug in TextNode.toHTML(): escaping < first turns &lt; into &amp;lt;.
    expect(escapeText('<')).toBe('&lt;');
    expect(escapeText('&lt;')).toBe('&amp;lt;');
});

test('escapes quotes in attributes but not in text', () => {
    expect(escapeAttribute('say "hi" & \'bye\'')).toBe(
        'say &quot;hi&quot; &amp; &#39;bye&#39;',
    );
    expect(escapeText('say "hi"')).toBe('say "hi"');
});

test('a comment is omitted', () => {
    // A comment opens on a '%' preceded by a space.
    const out = html('Before %an editorial note% after');
    expect(out).not.toContain('editorial');
    expect(out).toContain('Before');
    expect(out).toContain('after');
});

test('a label becomes an anchor rather than vanishing', () => {
    expect(html(':spot Text')).toContain('<span id="spot"></span>');
});

test('a code block keeps its code, not its language', () => {
    // The bug in InlineCodeNode.toHTML() was emitting the language instead.
    // The language goes on the opening line, the caption after the closing tick.
    const out = html('`python\nprint(1)\n`A caption');
    expect(out).toContain('<code>print(1)</code>');
    expect(out).toContain('language-python');
    // CodeNode.toHTML() emitted a second opening <pre> instead of closing it.
    expect(out).toContain('</pre>');
    expect(out).toContain('<figcaption>A caption</figcaption>');
});

test('a code block escapes markup in the code', () => {
    expect(html('`\n<script>&\n`')).toContain('&lt;script&gt;&amp;');
});

test('a quote with a credit becomes a figure with a citation', () => {
    const out = html('"\nQuoted.\n"Someone');
    expect(out).toContain('<blockquote><p>Quoted.</p></blockquote>');
    expect(out).toContain('<cite>Someone</cite>');
});

test('a callout becomes an aside', () => {
    expect(html('=\nAttention.\n=')).toBe(
        '<aside class="callout"><p>Attention.</p></aside>',
    );
});

test('a table has a header row, a body, and closed rows', () => {
    // TableNode.toHTML() never closed its <tr> elements.
    const out = html(',a|b\n,c|d\nA caption');
    expect(out).toContain('<thead><tr><th>a</th><th>b</th></tr></thead>');
    expect(out).toContain('<tbody><tr><td>c</td><td>d</td></tr></tbody>');
    expect(out).toContain('<caption>A caption</caption>');
});

test('a footnote becomes a linked reference plus an endnote', () => {
    const ctx = context();
    const chapter = Parser.parseChapter(ctx.edition, 'Text{the note}.');
    const { body, endnotes } = serializeChapter(chapter, ctx);

    expect(body).toContain('epub:type="noteref"');
    expect(body).toContain('href="#fn-0"');
    expect(body).toContain('id="fnref-0"');
    expect(body).toContain('<sup>a</sup>');

    expect(endnotes).toHaveLength(1);
    expect(endnotes[0].symbol).toBe('a');
    expect(endnotes[0].content).toBe('the note');

    const section = endnoteSection(endnotes);
    expect(section).toContain('id="fn-0"');
    // The endnote links back to where it was referenced.
    expect(section).toContain('href="#fnref-0"');
});

test('footnotes are lettered in document order', () => {
    const ctx = context();
    const { endnotes } = serializeChapter(
        Parser.parseChapter(ctx.edition, 'A{first} B{second}'),
        ctx,
    );
    expect(endnotes.map((n) => n.symbol)).toEqual(['a', 'b']);
});

test('a citation links to its reference', () => {
    const ctx = context({
        edition: makeEdition({ references: { ko2020: 'Ko, A. (2020).' } }),
    });
    expect(html('Text<ko2020>.', ctx)).toContain(
        '<a href="references.xhtml#ref-ko2020">ko2020</a>',
    );
});

test('an unknown citation degrades to plain text', () => {
    const out = html('Text<nope>.');
    expect(out).toContain('<sup class="citation">nope</sup>');
    expect(out).not.toContain('<a ');
});

test('a definition links to the glossary', () => {
    const ctx = context({
        edition: makeEdition({
            glossary: {
                bug: { phrase: 'bug', definition: 'A defect', synonyms: [] },
            },
        }),
    });
    expect(html('A ~bug~bug here.', ctx)).toContain(
        '<a class="definition" href="glossary.xhtml#gloss-bug">bug</a>',
    );
});

test('an unknown definition degrades to plain text', () => {
    expect(html('A ~bug~nope here.')).toBe('<p>A bug here.</p>');
});

test('a chapter link points at the chapter document', () => {
    const ctx = context({ chapters: new Set(['intro']) });
    expect(html('[go|intro]', ctx)).toBe('<p><a href="intro.xhtml">go</a></p>');
});

test('a chapter link with a label points at the label', () => {
    const ctx = context({ chapters: new Set(['intro']) });
    expect(html('[go|intro:spot]', ctx)).toBe(
        '<p><a href="intro.xhtml#spot">go</a></p>',
    );
});

test('a label-only link stays within the document', () => {
    expect(html('[go|:spot]')).toBe('<p><a href="#spot">go</a></p>');
});

test('a link to a chapter not in the package keeps the words but drops the link', () => {
    expect(html('[go|missing]')).toBe('<p>go</p>');
});

test('an image points at its packaged path', () => {
    const ctx = context({
        images: new Map([['photo.jpg', 'images/0.jpg']]),
    });
    const out = html('|photo.jpg|A photo|A caption|A credit|', ctx);
    expect(out).toContain('<img src="images/0.jpg" alt="A photo"/>');
    expect(out).toContain('<figcaption>A caption');
    expect(out).toContain('<span class="credit">A credit</span>');
});

test('an image that could not be packaged keeps its caption', () => {
    const out = html('|photo.jpg|A photo|A caption|A credit|');
    expect(out).not.toContain('<img');
    expect(out).toContain('A caption');
});

test('a video embed becomes a link rather than disappearing', () => {
    const out = html('|https://www.youtube.com/embed/abc|A video|Watch this||');
    expect(out).toContain('<a href="https://www.youtube.com/embed/abc">');
    expect(out).not.toContain('<iframe');
});

test('an image alt attribute cannot break out of its quotes', () => {
    const ctx = context({ images: new Map([['p.jpg', 'images/0.jpg']]) });
    // The parser curls straight quotes, so markup characters are what matter
    // here; escapeAttribute covers quoting directly.
    const out = html('|p.jpg|A & <angled> alt|||', ctx);
    expect(out).toContain('alt="A &amp; &lt;angled&gt; alt"');
    expect(xmlErrorIn(document_('T', out))).toBeUndefined();
});

// The property that decides whether an e-reader will open the file at all.
test.each([
    ['a paragraph', 'Hello.'],
    ['a header', '# Header'],
    ['formatting', '*bold* and _italic_ and ^sup^'],
    ['a list', '* One\n\n* Two'],
    ['a nested list', '* One\n\n** Nested\n\n* Two'],
    ['a numbered list', '1. One\n\n2. Two'],
    ['a rule', '-'],
    ['a line break', 'One\\\ntwo'],
    ['a table', ',a|b\n,c|d\nCaption'],
    ['a code block', '`html\n<div>&amp;</div>\n`'],
    ['inline code', 'Try `x < y`js here'],
    ['a quote', '"\nQuoted.\n"Someone'],
    ['a callout', '=\nAttention.\n='],
    ['an image', '|p.jpg|Alt|Caption|Credit|'],
    ['a footnote', 'Text{a note} more'],
    ['a citation', 'Text<ref> more'],
    ['a definition', 'A ~term~id here'],
    ['a label', ':spot Text'],
    ['a link', '[text|https://example.com/?a=1&b=2]'],
    ['a comment', 'Before %a note% after'],
    ['unescaped characters', 'Less < greater > amp & quote " apostrophe \''],
])('%s produces well-formed XML', (_name: string, bookdown: string) => {
    const ctx = context({ images: new Map([['p.jpg', 'images/0.jpg']]) });
    const chapter = Parser.parseChapter(ctx.edition, bookdown);
    const { body, endnotes } = serializeChapter(chapter, ctx);
    const xhtml = document_('Title', body + endnoteSection(endnotes));
    expect(xmlErrorIn(xhtml)).toBeUndefined();
});

test('a document declares the epub namespace its footnotes use', () => {
    expect(document_('T', '')).toContain(
        'xmlns:epub="http://www.idpf.org/2007/ops"',
    );
});

test('a document escapes its title', () => {
    expect(document_('A & B', '')).toContain('<title>A &amp; B</title>');
});
