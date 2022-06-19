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

    toText(): string {
        return this.#content.toText();
    }

    toBookdown(debug?: number): string {
        return (this.#level === 1 ? "# " : this.#level === 2 ? "## " : this.#level === 3 ? "### " : "") + this.#content.toBookdown(debug);
    }

    traverseChildren(fn: (node: Node) => void): void {
        this.#content?.traverse(fn);
    }

    copy(): ParagraphNode { return new ParagraphNode(this.#level, this.#content.copy()); }

    getSelection(): CaretRange {
        const first = this.getFirstTextNode();
        const last = this.getLastTextNode();
        return { start: { node: first, index: 0}, end: { node: last, index: last.getLength() } };
    }

    getFirstTextNode(): TextNode { return this.getContent().getFirstTextNode(); }

    getLastTextNode(): TextNode { return this.getContent().getLastTextNode(); }

    getFirstCaret(): Caret { return this.#content.getFirstCaret(); }
    getLastCaret(): Caret { return this.#content.getLastCaret(); }

    getTextNodes(): TextNode[] {
        return this.getNodes().filter(n => n instanceof TextNode) as TextNode[];
    }

    withLevel(level: number): ParagraphNode { return new ParagraphNode(level, this.#content); }
    withContent(content: FormatNode): ParagraphNode { return new ParagraphNode(this.#level, content); }
    withChildReplaced(node: Node, replacement: Node | undefined) {
        return node instanceof FormatNode && node === this.#content && replacement instanceof FormatNode ? 
            new ParagraphNode(this.#level, replacement) : 
            undefined;
    }

    withParagraphAppended(paragraph : ParagraphNode): ParagraphNode {
        return new ParagraphNode(
            this.#level, 
            new FormatNode("", [ ... this.#content.getSegments(), ... paragraph.#content.getSegments() ])
        );
    }

    split(caret: Caret): [ ParagraphNode, ParagraphNode ] | undefined {

        // If we weren't given a text node, do nothing.
        if(!(caret.node instanceof TextNode)) return;

        // If this caret isn't in this paragraph, do nothing.
        if(this.getParentOf(caret.node) === undefined) return;

        // If the caret is at the last position of the paragraph, insert a new empty paragraph.
        const lastTextNode = this.getLastTextNode();
        if(caret.node === lastTextNode && caret.index == lastTextNode.getLength())
            return [ this, new ParagraphNode() ];

        // If the caret is in the first position of the paragraph, insert a new empty paragraph before.
        const firstTextNode = this.getFirstTextNode();
        if(caret.node === firstTextNode && caret.index == 0)
            return [ new ParagraphNode(), this ];

        // Otherwise, split the paragraph in two, with the caret at the beginning of the second.
        const before = this.#content.withoutContentBefore(caret);
        const after = this.#content.withoutContentAfter(caret);
        if(before === undefined || after === undefined) return;
        return [ new ParagraphNode(this.#level, after), new ParagraphNode(this.#level, before) ];
        
    }
    
    getParentOf(node: Node): Node | undefined { return node === this.#content ? this : this.#content.getParentOf(node); }

}
