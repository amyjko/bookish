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

    traverseChildren(fn: (node: Node) => void): void {
        this.getBlocks().forEach(item => item.traverse(fn))
        this.#credit?.traverse(fn)
    }

    copy(): QuoteNode { return new QuoteNode(this.blocks.map(b => b.copy())); }

    withChildReplaced(node: Node, replacement: Node | undefined) {
        // Replace a block.
        const index = this.blocks.indexOf(node as BlockNode);
        if(index >= 0) {
            const newBlocks = this.blocks.slice();
            newBlocks[index] = replacement as BlockNode;
            return new QuoteNode(newBlocks, this.#credit, this.#position);
        }
        // Replace the credit.
        if(this.#credit === node && replacement instanceof FormatNode)
            return new QuoteNode(this.blocks, replacement, this.#position);
    }

    create(blocks: BlockNode[]): BlocksNode { return new QuoteNode(blocks, this.#credit, this.#position); }

    withCredit(credit: FormatNode | undefined): QuoteNode { return new QuoteNode(this.getBlocks(), credit, this.#position); }
    withPosition(position: Position): QuoteNode { return new QuoteNode(this.getBlocks(), this.#credit, position); }

}
