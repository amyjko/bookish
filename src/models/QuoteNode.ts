import { Node } from "./Node";
import { BlockNode } from "./BlockNode";
import { Position } from "./Position";
import { FormatNode } from "./FormatNode";
import { BlocksNode } from "./BlocksNode";
import { TextNode } from "./TextNode";

export class QuoteNode extends BlocksNode {
    
    readonly #credit: FormatNode | undefined;
    readonly #position: Position;

    constructor(elements: BlockNode[], credit?:FormatNode, position:Position="|") {

        super(elements);

        this.#position = position;
        this.#credit = credit === undefined ? new FormatNode("", [ new TextNode("") ]) : credit;

    }

    getType() { return "quote"; }

    getCredit() { return this.#credit; }
    getPosition() { return this.#position; }

    getFormats() { return this.#credit ? [ this.#credit ] : []; }

    toText(): string {
        return this.getBlocks().map(element => element.toText()).join(" ") + (this.#credit ? " " + this.#credit.toText() : "");
    }

    toBookdown(debug?: number): string {
        return `"\n${this.getBlocks().map(element => element.toBookdown(debug)).join("\n\n")}\n"${this.#position === "|" ? "" : this.#position}${this.#credit ? " " + this.#credit.toBookdown(debug) : ""}`;
    }

    getChildren(): Node[] { return this.#credit === undefined ? this.blocks : [ ...this.blocks, this.#credit ]; }

    copy() { return new QuoteNode(this.blocks.map(b => b.copy())) as this; }
    create(blocks: BlockNode[]): BlocksNode { return new QuoteNode(blocks, this.#credit, this.#position); }

    withChildReplaced(node: Node, replacement: Node | undefined) {

        // Replace the credit.
        if(this.#credit === node && replacement instanceof FormatNode)
            return new QuoteNode(this.blocks, replacement, this.#position) as this;
    
        // Replace a block.
        if(replacement !== undefined && !(replacement instanceof BlockNode)) return;
        const index = this.blocks.indexOf(node as BlockNode);
        if(index < 0) return;

        // Make a new blocks node, assigning and re-parenting the replacement.
        const blocks = replacement === undefined ?
            [ ...this.blocks.slice(0, index), ...this.blocks.slice(index + 1)] :
            [ ...this.blocks.slice(0, index), replacement, ...this.blocks.slice(index + 1) ];

        return new QuoteNode(blocks, this.#credit, this.#position) as this;

    }

    withCredit(credit: FormatNode | undefined): QuoteNode { return new QuoteNode(this.getBlocks(), credit, this.#position); }
    withPosition(position: Position): QuoteNode { return new QuoteNode(this.getBlocks(), this.#credit, position); }

}