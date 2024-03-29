import type Node from './Node';
import BlockNode from './BlockNode';
import FormatNode from './FormatNode';
import TextNode from './TextNode';
import type Caret from './Caret';
import type { CaretRange } from './Caret';
import AtomNode from './AtomNode';
import MetadataNode from './MetadataNode';

export default class ParagraphNode extends BlockNode {
    readonly #format: FormatNode;
    readonly #level: number;

    constructor(level: number = 0, format?: FormatNode) {
        super();

        // Always ensure the paragraphs have an empty space at the begining and end for insertion.
        let adjustedFormat = format ?? new FormatNode('', [new TextNode()]);
        if (adjustedFormat.getLength() > 0) {
            const first = adjustedFormat.getSegments()[0];
            const last =
                adjustedFormat.getSegments()[adjustedFormat.getLength() - 1];
            if (first instanceof AtomNode || first instanceof MetadataNode)
                adjustedFormat = adjustedFormat.withSegmentPrepended(
                    new TextNode(),
                );
            if (last instanceof AtomNode || last instanceof MetadataNode)
                adjustedFormat = adjustedFormat.withSegmentAppended(
                    new TextNode(),
                );
        }
        // Always ensure a paragraph has at least an empty text node.
        adjustedFormat = adjustedFormat.withTextIfEmpty();

        this.#format = adjustedFormat;
        this.#level = level;
    }

    getType() {
        return 'paragraph';
    }
    getLevel() {
        return this.#level;
    }
    getFormat() {
        return this.#format;
    }
    getFormats() {
        return [this.#format];
    }
    getChildren() {
        return [this.#format];
    }
    getFirstTextNode(): TextNode {
        return this.getFormat().getFirstTextNode();
    }
    getLastTextNode(): TextNode {
        return this.getFormat().getLastTextNode();
    }
    getTextNodes(): TextNode[] {
        return this.getNodes().filter(
            (n) => n instanceof TextNode,
        ) as TextNode[];
    }
    getFirstCaret(): Caret | undefined {
        return this.#format.getFirstCaret();
    }
    getLastCaret(): Caret | undefined {
        return this.#format.getLastCaret();
    }
    getSelection(): CaretRange {
        const first = this.getFirstTextNode();
        const last = this.getLastTextNode();
        return {
            start: { node: first, index: 0 },
            end: { node: last, index: last.getLength() },
        };
    }
    getParentOf(node: Node): Node | undefined {
        return node === this.#format ? this : this.#format.getParentOf(node);
    }

    toText(): string {
        return this.#format.toText();
    }

    toBookdown(): string {
        return this.#level === 0
            ? this.#format.toBookdown()
            : `${'#'.repeat(this.#level)} ${this.#format.toBookdown()}`;
    }

    toHTML(): string {
        const tag = this.#level === 0 ? 'p' : `h${this.#level}`;
        return `<${tag}>${this.#format.toHTML()}</${tag}>`;
    }

    withLevel(level: number): ParagraphNode {
        return new ParagraphNode(level, this.#format);
    }

    withContent(content: FormatNode): ParagraphNode {
        return new ParagraphNode(this.#level, content);
    }

    withParagraphAppended(paragraph: ParagraphNode): ParagraphNode {
        return new ParagraphNode(
            this.#level,
            new FormatNode('', [
                ...this.#format.getSegments(),
                ...paragraph.#format.getSegments(),
            ]),
        );
    }

    withParagraphPrepended(paragraph: ParagraphNode): ParagraphNode {
        return new ParagraphNode(
            this.#level,
            new FormatNode('', [
                ...paragraph.#format.getSegments(),
                ...this.#format.getSegments(),
            ]),
        );
    }

    split(caret: Caret): [ParagraphNode, ParagraphNode] | undefined {
        // If we weren't given a text node, do nothing.
        if (!(caret.node instanceof TextNode)) return;

        // If this caret isn't in this paragraph, do nothing.
        if (this.getParentOf(caret.node) === undefined) return;

        // If the caret is at the last position of the paragraph, insert a new empty paragraph.
        const lastTextNode = this.getLastTextNode();
        if (
            caret.node === lastTextNode &&
            caret.index === lastTextNode.getLength()
        )
            return [this.copy(), new ParagraphNode()];

        // If the caret is in the first position of the paragraph, insert a new empty paragraph before.
        const firstTextNode = this.getFirstTextNode();
        if (caret.node === firstTextNode && caret.index === 0)
            return [new ParagraphNode(), this.copy()];

        // Otherwise, split the paragraph in two, with the caret at the beginning of the second.
        const before = this.#format.withoutContentAfter(caret);
        const after = this.#format.withoutContentBefore(caret);
        if (after === undefined || before === undefined) return;
        return [
            new ParagraphNode(this.#level, before),
            new ParagraphNode(this.#level, after),
        ];
    }

    copy() {
        return new ParagraphNode(this.#level, this.#format.copy()) as this;
    }

    withChildReplaced(node: Node, replacement: Node | undefined) {
        return node === this.#format &&
            (replacement instanceof FormatNode || replacement === undefined)
            ? (new ParagraphNode(this.#level, replacement) as this)
            : undefined;
    }

    withContentInRange(range: CaretRange): this | undefined {
        const newFormat = this.#format.withContentInRange(range);
        if (newFormat === undefined) return;
        return new ParagraphNode(this.#level, newFormat) as this;
    }
}
