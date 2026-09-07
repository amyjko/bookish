/**
 * Serializes chapter ASTs to the XHTML that EPUB requires.
 *
 * This deliberately does not reuse `Node.toHTML()`. That serializer is lossy by
 * design -- footnotes, citations and definitions collapse to parenthesised text
 * and labels vanish -- and it has no access to the edition, so it cannot number
 * a footnote or resolve a citation to its reference. It also emits HTML, not
 * XHTML, and EPUB readers reject documents that are not well-formed XML.
 *
 * The three things the web reader renders as marginal pop-ups (footnotes,
 * citations, definitions) all become ordinary links here, because an e-reader
 * has no margin to put them in.
 */

import type Edition from '../models/book/Edition';
import type ChapterNode from '../models/chapter/ChapterNode';
import type Node from '../models/chapter/Node';
import BlockNode from '../models/chapter/BlockNode';
import CalloutNode from '../models/chapter/CalloutNode';
import CitationsNode from '../models/chapter/CitationsNode';
import CodeNode from '../models/chapter/CodeNode';
import CommentNode from '../models/chapter/CommentNode';
import DefinitionNode from '../models/chapter/DefinitionNode';
import EmbedNode from '../models/chapter/EmbedNode';
import ErrorNode from '../models/chapter/ErrorNode';
import FootnoteNode from '../models/chapter/FootnoteNode';
import FormatNode from '../models/chapter/FormatNode';
import InlineCodeNode from '../models/chapter/InlineCodeNode';
import LabelNode from '../models/chapter/LabelNode';
import LineBreakNode from '../models/chapter/LineBreakNode';
import LinkNode from '../models/chapter/LinkNode';
import ListNode from '../models/chapter/ListNode';
import ParagraphNode from '../models/chapter/ParagraphNode';
import QuoteNode from '../models/chapter/QuoteNode';
import RuleNode from '../models/chapter/RuleNode';
import TableNode from '../models/chapter/TableNode';
import TextNode from '../models/chapter/TextNode';

/** Escape text content. Order matters: ampersands first, or we escape our own escapes. */
export function escapeText(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

/** Escape an attribute value, which additionally must not close its own quotes. */
export function escapeAttribute(value: string): string {
    return escapeText(value).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/**
 * The context a chapter needs to resolve its cross-references: which edition it
 * belongs to, which images made it into the package, and which chapters exist
 * (so a link to a missing one degrades to plain text rather than a dead link).
 */
export type SerializationContext = {
    edition: Edition;
    /** Maps an embed's URL to its path inside the package, e.g. `images/3.jpg`. */
    images: Map<string, string>;
    /** Chapter IDs that have their own document in the package. */
    chapters: Set<string>;
};

/** A footnote gathered while serializing, to be emitted as an endnote. */
type Endnote = { id: string; symbol: string; content: string };

/**
 * Serialize one chapter's blocks, returning the body markup and the endnotes
 * that its footnotes produced. Callers place the endnotes wherever they like;
 * `chapterDocument` puts them at the end of the chapter.
 */
export function serializeChapter(
    chapter: ChapterNode,
    context: SerializationContext,
): { body: string; endnotes: Endnote[] } {
    const endnotes: Endnote[] = [];
    const footnotes = chapter.getFootnotes();
    const headers = chapter.getHeaders();

    const body = chapter
        .getBlocks()
        .map((block) =>
            block_(block, { ...context, footnotes, headers, endnotes }),
        )
        .join('\n');

    return { body, endnotes };
}

type Local = SerializationContext & {
    footnotes: FootnoteNode[];
    headers: ParagraphNode[];
    endnotes: Endnote[];
};

/** Serialize a block-level node. */
function block_(node: Node, local: Local): string {
    if (node instanceof ParagraphNode) {
        const level = node.getLevel();
        const content = inline(node.getFormat(), local);
        if (level === 0) return `<p>${content}</p>`;
        // The chapter title is the document's h1, so headers start at h2. The
        // id mirrors Paragraph.svelte so in-book links to headers still land.
        const index = local.headers.indexOf(node);
        const id = index >= 0 ? ` id="header-${index}"` : '';
        const tag = `h${Math.min(level + 1, 6)}`;
        return `<${tag}${id}>${content}</${tag}>`;
    }

    if (node instanceof ListNode) return list(node, local);

    if (node instanceof EmbedNode) return embed(node, local);

    if (node instanceof CodeNode) {
        const language = node.getLanguage();
        const caption = inline(node.getCaption(), local);
        // No syntax highlighting: e-ink is greyscale, and the spans would only
        // add weight. The language is kept as a class for readers that style it.
        const code = `<pre class="code${
            language && language !== 'plaintext'
                ? ` language-${escapeAttribute(language)}`
                : ''
        }"><code>${escapeText(node.getCode())}</code></pre>`;
        return caption.trim().length > 0
            ? `<figure class="code-figure">${code}<figcaption>${caption}</figcaption></figure>`
            : code;
    }

    if (node instanceof QuoteNode) {
        const credit = inline(node.getCredit(), local);
        const blocks = node
            .getBlocks()
            .map((b) => block_(b, local))
            .join('\n');
        return credit.trim().length > 0
            ? `<figure class="quote"><blockquote>${blocks}</blockquote><figcaption><cite>${credit}</cite></figcaption></figure>`
            : `<blockquote>${blocks}</blockquote>`;
    }

    if (node instanceof CalloutNode)
        return `<aside class="callout">${node
            .getBlocks()
            .map((b) => block_(b, local))
            .join('\n')}</aside>`;

    if (node instanceof TableNode) return table(node, local);

    if (node instanceof RuleNode) return '<hr/>';

    // Editorial comments and parse errors are for authors, not readers.
    if (node instanceof CommentNode || node instanceof ErrorNode) return '';

    return '';
}

function list(node: ListNode, local: Local): string {
    const tag = node.isNumbered() ? 'ol' : 'ul';
    const items = node
        .getItems()
        .map((item) =>
            item instanceof ListNode
                ? // A nested list belongs inside a list item, not between them.
                  `<li>${list(item, local)}</li>`
                : `<li>${inline(item, local)}</li>`,
        )
        .join('');
    return `<${tag}>${items}</${tag}>`;
}

function table(node: TableNode, local: Local): string {
    const rows = node.getRows();
    const caption = inline(node.getCaption(), local);
    // Row 0 is the header row, matching how Table.svelte renders it.
    const head =
        rows.length > 0
            ? `<thead><tr>${rows[0]
                  .map((cell) => `<th>${inline(cell, local)}</th>`)
                  .join('')}</tr></thead>`
            : '';
    const body = rows
        .slice(1)
        .map(
            (row) =>
                `<tr>${row
                    .map((cell) => `<td>${inline(cell, local)}</td>`)
                    .join('')}</tr>`,
        )
        .join('');
    return `<table>${
        caption.trim().length > 0 ? `<caption>${caption}</caption>` : ''
    }${head}<tbody>${body}</tbody></table>`;
}

function embed(node: EmbedNode, local: Local): string {
    const caption = inline(node.getCaption(), local);
    const credit = inline(node.getCredit(), local);
    const description = escapeAttribute(node.getDescription());

    const figcaption =
        caption.trim().length > 0 || credit.trim().length > 0
            ? `<figcaption>${caption}${
                  credit.trim().length > 0
                      ? `<span class="credit">${credit}</span>`
                      : ''
              }</figcaption>`
            : '';

    // Video embeds are iframes on the web, which EPUB has no equivalent for, so
    // offer the link instead of silently dropping the content.
    if (node.isVideo()) {
        const url = escapeAttribute(node.getURL());
        // The caption belongs to the figure, so the link is labelled with the
        // description instead; using the caption for both printed it twice.
        const label =
            node.getDescription().trim().length > 0
                ? escapeText(node.getDescription())
                : url;
        return `<figure class="video"><p><a href="${url}">${label}</a></p>${figcaption}</figure>`;
    }

    const path = local.images.get(node.getURL());
    // An image that could not be fetched or decoded keeps its caption and
    // description, so the reader still knows what was meant to be here.
    if (path === undefined)
        return figcaption.length > 0
            ? `<figure class="missing-image">${figcaption}</figure>`
            : description.length > 0
              ? `<figure class="missing-image"><figcaption>${escapeText(
                    node.getDescription(),
                )}</figcaption></figure>`
              : '';

    return `<figure><img src="${escapeAttribute(
        path,
    )}" alt="${description}"/>${figcaption}</figure>`;
}

/** Serialize an inline node and its descendants. */
function inline(node: Node, local: Local): string {
    if (node instanceof TextNode) return escapeText(node.getText());

    if (node instanceof FormatNode) {
        const content = node
            .getSegments()
            .map((segment) => inline(segment, local))
            .join('');
        const format = node.getFormat();
        return format === '*'
            ? `<strong>${content}</strong>`
            : format === '_'
              ? `<em>${content}</em>`
              : format === '^'
                ? `<sup>${content}</sup>`
                : format === 'v'
                  ? `<sub>${content}</sub>`
                  : content;
    }

    if (node instanceof LineBreakNode) return '<br/>';

    if (node instanceof InlineCodeNode)
        return `<code>${escapeText(node.getText().getText())}</code>`;

    if (node instanceof LinkNode) return link(node, local);

    if (node instanceof FootnoteNode) return footnote(node, local);

    if (node instanceof CitationsNode) return citations(node, local);

    if (node instanceof DefinitionNode) return definition(node, local);

    if (node instanceof LabelNode)
        // An empty anchor, so links to this label resolve. toHTML() drops these.
        return `<span id="${escapeAttribute(node.getMeta())}"></span>`;

    // Editorial comments never reach readers.
    if (node instanceof CommentNode) return '';

    if (node instanceof ErrorNode) return '';

    // A block that turned up inline (a nested list item, say).
    if (node instanceof BlockNode) return block_(node, local);

    return '';
}

/** The document filename for a chapter. */
export function chapterPath(chapterID: string): string {
    return `${chapterID}.xhtml`;
}

function link(node: LinkNode, local: Local): string {
    const url = node.getMeta();
    const content = escapeText(node.getText().getText());

    if (url.startsWith('http'))
        return `<a href="${escapeAttribute(url)}">${content}</a>`;

    // Bookdown addresses another chapter as `chapter`, `chapter:label`, or a
    // label in this chapter as `:label`.
    const separator = url.includes(':') ? ':' : url.includes('#') ? '#' : ':';
    const [chapter, label] = url.split(separator);

    if (chapter.length === 0)
        return label === undefined
            ? content
            : `<a href="#${escapeAttribute(label)}">${content}</a>`;

    // A link to a chapter that isn't in the package (forthcoming, or one of the
    // interactive pages we omit) would be dead, so keep the words and drop the link.
    if (!local.chapters.has(chapter)) return content;

    const href =
        label === undefined || label.length === 0
            ? chapterPath(chapter)
            : `${chapterPath(chapter)}#${escapeAttribute(label)}`;
    return `<a href="${escapeAttribute(href)}">${content}</a>`;
}

function footnote(node: FootnoteNode, local: Local): string {
    const index = local.footnotes.indexOf(node);
    if (index < 0) return '';
    const symbol = local.edition.getFootnoteSymbol(index);
    const id = `fn-${index}`;

    local.endnotes.push({
        id,
        symbol,
        content: inline(node.getMeta(), local),
    });

    return `<a class="noteref" epub:type="noteref" href="#${id}" id="fnref-${index}"><sup>${escapeText(
        symbol,
    )}</sup></a>`;
}

function citations(node: CitationsNode, local: Local): string {
    const ids = node.getMeta();
    if (ids.length === 0) return '';

    const links = ids
        .map((id) => {
            const reference = local.edition.getReference(id);
            const label = escapeText(id);
            // An unknown citation has no reference entry to link to.
            return reference === undefined
                ? label
                : `<a href="references.xhtml#ref-${escapeAttribute(
                      id,
                  )}">${label}</a>`;
        })
        .join(', ');

    return `<sup class="citation">${links}</sup>`;
}

function definition(node: DefinitionNode, local: Local): string {
    const id = node.getMeta();
    const phrase = escapeText(node.getText().getText());
    return local.edition.getGlossary()[id] === undefined
        ? phrase
        : `<a class="definition" href="glossary.xhtml#gloss-${escapeAttribute(
              id,
          )}">${phrase}</a>`;
}

/** Serialize a standalone format node, for titles, captions and definitions. */
export function serializeFormat(
    node: FormatNode,
    context: SerializationContext,
): string {
    return inline(node, {
        ...context,
        footnotes: [],
        headers: [],
        endnotes: [],
    });
}

/** Render gathered footnotes as an endnote section with links back to the text. */
export function endnoteSection(endnotes: Endnote[]): string {
    if (endnotes.length === 0) return '';
    return `<section class="notes" epub:type="footnotes">
<h2>Notes</h2>
${endnotes
    .map(
        (note, index) =>
            `<aside class="note" epub:type="footnote" id="${note.id}"><p><a href="#fnref-${index}"><sup>${escapeText(
                note.symbol,
            )}</sup></a> ${note.content}</p></aside>`,
    )
    .join('\n')}
</section>`;
}

/**
 * Wrap body markup in a complete XHTML document. The epub namespace is declared
 * on every document because footnote markup uses `epub:type`, and an undeclared
 * prefix makes the XML malformed.
 */
export function document_(title: string, body: string): string {
    return `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="en" xml:lang="en">
<head>
<meta charset="utf-8"/>
<title>${escapeText(title)}</title>
<link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
${body}
</body>
</html>`;
}
