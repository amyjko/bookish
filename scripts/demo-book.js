/**
 * The demo book's prose. Kept apart from the seeding mechanics so the content
 * is easy to read and extend.
 *
 * Between them the chapters use every Bookdown construct the reader supports,
 * which is the point: this is what you page through to see how a change
 * renders, on screen and on a device.
 */

/** Chapter metadata and text, in reading order. */
export const CHAPTERS = [
    {
        id: 'formatting',
        title: 'Words',
        section: 'Part One: The Sentence',
        numbered: true,
        forthcoming: false,
        authors: ['Ada Demo'],
        image: '|panorama.png|A wide banded landscape.|||',
        text: `:start This chapter is about everything that can happen inside a sentence.

Text can be *bold*, _italic_, ^superscript^, and ^vsubscript^. It can be *_both at once_* if you insist. A line break comes from a trailing backslash,\\
like that, and the sentence continues.

Inline code looks like \`const answer = 42\`js, and a bare span of code with no language is \`just monospace\`.

# Links of every kind

An external link goes [somewhere else|https://en.wikipedia.org/wiki/EPUB]. A link to another chapter goes to [the blocks chapter|blocks]. A link to a labelled spot in another chapter goes to [that chapter's tables|tables:grid]. A link to a label in this chapter jumps [back to the start|:start].

A link to a chapter that does not exist, like [this one|nowhere], renders as plain text rather than a dead link.

# Symbols

Symbols are substituted at parse time, so @project always renders the same way and @version stays consistent across chapters.

# Editorial marks

This sentence has a comment after it %this note is only visible while editing% which readers never see.`,
    },
    {
        id: 'blocks',
        title: 'Blocks',
        section: 'Part One: The Sentence',
        numbered: true,
        forthcoming: false,
        authors: [],
        image: null,
        text: `Every block-level construct lives here, one after another, so you can see the vertical rhythm between them.

# A first-level header

Paragraphs following a header are not indented, because they do not continue anything.

## A second-level header

### A third-level header

#### A fourth-level header

# Lists

A bulleted list:

* The first item

* The second item, which is long enough to wrap onto another line on a narrow screen so you can see how the hanging indent behaves

* The third item

A numbered list:

1. Step one

2. Step two

3. Step three

# Quotes

"
A quotation is set as its own block, and can run to several sentences. It carries a credit underneath when one is given.
"Someone Quotable

# Callouts

=
A callout holds an aside that matters enough to interrupt the flow, but not enough to become its own section.
=

# Code

\`python
def fits(width, height, max_width, max_height):
    scale = min(max_width / width, max_height / height, 1)
    return round(width * scale), round(height * scale)
\`How an image is fitted to a budget.

# Rules

A rule separates what comes before

-

from what comes after.`,
    },
    {
        // Not 'media': that is a reserved built-in page id, along with
        // references, search, index, glossary, unknown and cover.
        id: 'pictures',
        title: 'Pictures',
        section: 'Part Two: The Page',
        numbered: true,
        forthcoming: false,
        authors: [],
        image: '|wedge.png|A stepped grey wedge.|||',
        text: `The images here are chosen to stress a small screen. Look at them on the device, not just here.

A photograph, with smooth gradients and fine texture. If the quality setting is too low, the texture turns to mush first.

|photo.png|A hillside under a gradient sky.|A photograph, which is where JPEG quality shows.|Generated for testing|

A diagram of hairlines. This is the one that tells you whether a size preset is too small: at some point the one-pixel rings merge into grey.

|diagram.png|Concentric rings over a fine grid, with a hatched quadrant.|A diagram, which is where resolution shows.|Generated for testing|<

A stepped grey wedge with a continuous ramp beneath it. On e-ink this shows the real tonal range and any banding.

|wedge.png|Sixteen grey steps above a continuous black to white ramp.|A tonal ramp.|Generated for testing|>

A very tall image, which has to be fitted by its height:

|portrait.png|A tall striped panel.|Fitted by height.||

A very wide one, fitted by its width:

|panorama.png|A wide banded landscape.|Fitted by width.||

An image with transparency. In an EPUB it is matted onto white, because a JPEG has no alpha and the transparent parts would otherwise go black.

|transparent.png|A red spoked ring on a transparent background.|Transparency, matted to white.||

A vector image, which is passed through untouched rather than rasterized:

|logo.svg|A circle and a triangle above a line.|An SVG, passed through as it is.||

A video, which an e-reader cannot embed, so the export leaves the caption and a link:

|https://www.youtube.com/embed/dQw4w9WgXcQ|A video.|A video embed.||`,
    },
    {
        id: 'scholarship',
        title: 'Notes and Sources',
        section: 'Part Two: The Page',
        numbered: true,
        forthcoming: false,
        authors: [],
        image: null,
        text: `This chapter is about the three things the web reader shows in the margin.

# Footnotes

A footnote hangs off a word like this{the first note, which can itself contain *formatting* and a [link|https://example.com]} and the reader follows it when they want it. A second one{the second note, so you can see the lettering advance} follows shortly after, and a third{the third} after that.

In the exported book these become endnotes at the end of the chapter, with a link in each direction, because an e-reader has no margin to put them in.

# Citations

A claim can cite one source<ko2020> or several at once<ko2020,nielsen1994,plain>. The numbers link to the reference list.

A citation with no matching reference<missing> keeps its identifier so an author can see what needs fixing.

# Definitions

A ~bug~bug is not the same thing as a ~defect~bug, though people use them interchangeably. An ~affordance~affordance is something else entirely. Definitions link into the glossary.`,
    },
    {
        id: 'tables',
        title: 'Tables',
        section: 'Part Two: The Page',
        numbered: true,
        forthcoming: false,
        authors: [],
        image: null,
        text: `:grid Tables are the construct most likely to overflow a small screen, so there are several shapes here.

A small table:

,Device|Screen|Resolution
,Kobo Clara|6 inch|1072 by 1448
,Kindle Paperwhite|6.8 inch|1236 by 1648
A few e-ink devices and their panels.

A wider one, which will need to scroll or shrink on a narrow screen:

,Preset|Longest edge|Quality|Color|Intended device|Typical image
,Compact|640|0.70|Greyscale|Pocket e-ink|20 to 40 KB
,Standard|1720|0.80|Color|Six inch e-ink|150 to 300 KB
,Large|2200|0.85|Color|Tablets|400 to 600 KB
The image size presets.

A table whose cells carry formatting:

,*Bold heading*|_Italic heading_
,A cell with \`code\`|A cell with a [link|https://example.com]
,A cell with a footnote{a note inside a table cell}|A cell with a citation<ko2020>
Formatting inside cells.`,
    },
    {
        id: 'unnumbered',
        title: 'An Unnumbered Chapter',
        section: undefined,
        numbered: false,
        forthcoming: false,
        authors: [],
        image: null,
        text: `Some chapters are not numbered. An afterword, a colophon, a note on the text. This is one of them, and it should carry no chapter number anywhere it appears.`,
    },
    {
        id: 'forthcoming',
        title: 'A Forthcoming Chapter',
        section: undefined,
        numbered: true,
        forthcoming: true,
        authors: [],
        image: null,
        text: `This chapter is marked forthcoming. It appears in the table of contents but is left out of the print view and the EPUB export.`,
    },
];

/** Everything about the book other than its chapters. */
export const BOOK = {
    title: 'The Demo Book: Every Feature At Once',
    authors: ['Ada Demo', '*Grace Example*'],
    description:
        'A book that uses every feature Bookish has, so you can see how a change renders without hunting for a real book that happens to exercise it.',
    cover: '|cover.png|A diagonal wash with a lighter band.|The demo book.|Generated for testing|',
    license: 'Licensed under _CC BY 4.0_. Do as you like with it.',
    acknowledgements:
        'Thanks to everyone who reads on a small screen and told us it was hard.',
    tags: ['demo', 'testing', 'epub'],
    symbols: {
        project: '*Bookish*',
        version: 'version 0.9',
    },
    references: {
        // The array form, which renders as a structured citation.
        ko2020: [
            'Ko, A. J.',
            '2020',
            'Cooperative Software Development',
            'University of Washington',
            'https://faculty.washington.edu/ajko/books/cooperative-software-development/',
            'A book about how software is made together.',
        ],
        nielsen1994: [
            'Nielsen, J.',
            '1994',
            'Usability Engineering',
            'Morgan Kaufmann',
            '',
            '',
        ],
        // The free-form string form, which is parsed as formatted text.
        plain: 'A free-form reference, written as _formatted text_ rather than fields.',
    },
    glossary: {
        bug: {
            phrase: 'bug',
            definition:
                'A defect in software: a place where what it does and what it should do disagree.',
            synonyms: ['defect', 'fault', 'error'],
        },
        affordance: {
            phrase: 'affordance',
            definition:
                'A property of a thing that suggests how it can be used, without instruction.',
            synonyms: [],
        },
    },
};
