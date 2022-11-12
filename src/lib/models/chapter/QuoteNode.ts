import type Node from "./Node";
import BlockNode from "./BlockNode";
import type Position from "./Position";
import FormatNode from "./FormatNode";
import BlocksNode from "./BlocksNode";
import TextNode from "./TextNode";
import type { CaretRange } from "./Caret";

export default class QuoteNode extends BlocksNode {
    
    readonly #credit: FormatNode;
    readonly #position: Position;

    constructor(elements: BlockNode[], credit?:FormatNode, position:Position="|") {

        super(elements);

        this.#position = position;
        this.#credit = credit === undefined ? new FormatNode("", [ new TextNode() ]) : credit.withTextIfEmpty();

    }

    getType() { return "quote"; }

    getCredit() { return this.#credit; }
    getPosition() { return this.#position; }

    getFormats() { return [ this.#credit ]; }

    toText(): string {
        return this.getBlocks().map(element => element.toText()).join(" ") + (this.#credit ? " " + this.#credit.toText() : "");
    }

    toBookdown(): string {
        return `"\n${this.getBlocks().map(element => element.toBookdown()).join("\n\n")}\n"${this.#position === "|" ? "" : this.#position}${this.#credit ? this.#credit.toBookdown() : ""}`;
    }
    toHTML() { return `"${super.toHTML()}"<center>${this.#credit.toHTML()}</center>`; }

    getChildren(): Node[] { return [ ...this.getBlocks(), this.#credit ]; }

    getParentOf(node: Node): Node | undefined {
        if(node === this.#credit) return this;
        const creditParent = this.#credit.getParentOf(node);
        if(creditParent !== undefined) return creditParent;
        return super.getParentOf(node);
    }

    copy() { return new QuoteNode(this.getBlocks().map(b => b.copy())) as this; }
    create(blocks: BlockNode[]): BlocksNode { return new QuoteNode(blocks, this.#credit, this.#position); }

    withChildReplaced(node: BlockNode | FormatNode, replacement: BlockNode | FormatNode | undefined) {

        // Replace the credit.
        if(this.#credit === node && (replacement instanceof FormatNode || replacement === undefined))
            return new QuoteNode(this.getBlocks(), replacement, this.#position) as this;
    
        // Replace a block.
        if(replacement !== undefined && !(replacement instanceof BlockNode)) return;
        const index = this.getBlocks().indexOf(node as BlockNode);
        if(index < 0) return;

        // Make a new blocks node, assigning and re-parenting the replacement.
        const blocks = replacement === undefined ?
            [ ...this.getBlocks().slice(0, index), ...this.getBlocks().slice(index + 1)] :
            [ ...this.getBlocks().slice(0, index), replacement, ...this.getBlocks().slice(index + 1) ];

        return new QuoteNode(blocks, this.#credit, this.#position) as this;

    }

    withCredit(credit: FormatNode | undefined): QuoteNode { return new QuoteNode(this.getBlocks(), credit, this.#position); }
    withPosition(position: Position): QuoteNode { return new QuoteNode(this.getBlocks(), this.#credit, position); }

    withContentInRange(range: CaretRange): this | undefined {
        // First get the blocks in range.
        const newQuote = super.withContentInRange(range);
        if(newQuote === undefined) return;

        const newCredit = this.getBlocks().find(b => b.contains(range.end.node)) !== undefined ? new FormatNode("", [ new TextNode() ]) : this.#credit.withContentInRange(range);
        return newQuote.withNodeReplaced(this.#credit, newCredit) as this;

    }

}