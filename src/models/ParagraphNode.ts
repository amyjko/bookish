import { Node } from "./Node";
import { FormatNode } from "./FormatNode";
import { BlockNode } from "./BlockNode";
import { TextNode } from "./TextNode";
import { Caret, CaretRange } from "./Caret";

export class ParagraphNode extends BlockNode {

    readonly #content: FormatNode;
    readonly #level: number;

    constructor(level: number = 0, content?: FormatNode) {
        super();

        this.#content = content === undefined ? new FormatNode("", [ new TextNode("") ]) : content;
        this.#level = level;

    }

    getType() { return "paragraph"; }
    getLevel() { return this.#level; }
    getContent() { return this.#content; }
    getFormats() { return [ this.#content ]; }
    getChildren() { return [ this.#content ] }
    getFirstTextNode(): TextNode { return this.getContent().getFirstTextNode(); }
    getLastTextNode(): TextNode { return this.getContent().getLastTextNode(); }
    getTextNodes(): TextNode[] { return this.getNodes().filter(n => n instanceof TextNode) as TextNode[]; }
    getFirstCaret(): Caret | undefined { return this.#content.getFirstCaret(); }
    getLastCaret(): Caret | undefined { return this.#content.getLastCaret(); }
    getSelection(): CaretRange {
        const first = this.getFirstTextNode();
        const last = this.getLastTextNode();
        return { start: { node: first, index: 0}, end: { node: last, index: last.getLength() } };
    }
    getParentOf(node: Node): Node | undefined { return node === this.#content ? this : this.#content.getParentOf(node); }

    toText(): string {
        return this.#content.toText();
    }

    toBookdown(debug?: number): string {
        return (this.#level === 1 ? "# " : this.#level === 2 ? "## " : this.#level === 3 ? "### " : "") + this.#content.toBookdown(debug);
    }

    withLevel(level: number): ParagraphNode { return new ParagraphNode(level, this.#content); }

    withContent(content: FormatNode): ParagraphNode { return new ParagraphNode(this.#level, content); }

    withParagraphAppended(paragraph : ParagraphNode): ParagraphNode {
        return new ParagraphNode(
            this.#level, 
            new FormatNode("", [ ...this.#content.getSegments(), ...paragraph.#content.getSegments() ])
        );
    }

    withParagraphPrepended(paragraph : ParagraphNode): ParagraphNode {
        return new ParagraphNode(
            this.#level, 
            new FormatNode("", [ ...paragraph.#content.getSegments(), ...this.#content.getSegments(),  ])
        );
    }

    split(caret: Caret): [ ParagraphNode, ParagraphNode ] | undefined {

        // If we weren't given a text node, do nothing.
        if(!(caret.node instanceof TextNode)) return;

        // If this caret isn't in this paragraph, do nothing.
        if(this.getParentOf(caret.node) === undefined) return;

        // If the caret is at the last position of the paragraph, insert a new empty paragraph.
        const lastTextNode = this.getLastTextNode();
        if(caret.node === lastTextNode && caret.index === lastTextNode.getLength())
            return [ this.copy(), new ParagraphNode() ];

        // If the caret is in the first position of the paragraph, insert a new empty paragraph before.
        const firstTextNode = this.getFirstTextNode();
        if(caret.node === firstTextNode && caret.index === 0)
            return [ new ParagraphNode(), this.copy() ];

        // Otherwise, split the paragraph in two, with the caret at the beginning of the second.
        const before = this.#content.withoutContentAfter(caret);
        const after = this.#content.withoutContentBefore(caret);
        if(after === undefined || before === undefined) return;
        return [ new ParagraphNode(this.#level, before), new ParagraphNode(this.#level, after) ];
        
    }

    copy() { return new ParagraphNode(this.#level, this.#content.copy()) as this; }

    withChildReplaced(node: Node, replacement: Node | undefined) {
        return node instanceof FormatNode && node === this.#content && replacement instanceof FormatNode ? 
            new ParagraphNode(this.#level, replacement) as this : 
            undefined;
    }

    withContentInRange(range: CaretRange): this | undefined {
        const newFormat = this.#content.withContentInRange(range);
        if(newFormat === undefined) return;
        return new ParagraphNode(this.#level, newFormat) as this;
    }

}
