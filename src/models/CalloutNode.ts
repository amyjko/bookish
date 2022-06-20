import { BlocksNode } from "./BlocksNode";
import { Node } from "./Node";
import { BlockNode } from "./BlockNode";
import { Position } from "./Position";

export class CalloutNode extends BlocksNode {
    
    readonly #position: Position;

    constructor(elements: BlockNode[], position: Position="|") {
        super(elements);
        this.#position = position;
    }

    getType() { return "callout"; }

    getPosition() { return this.#position; }

    toText(): string {
        return this.getBlocks().map(element => element.toText()).join(" ");
    }

    toBookdown(debug?: number): string {
        return "=\n" + this.getBlocks().map(element => element.toBookdown(debug)).join("\n\n") + "\n=" + (this.#position !== "|" ? this.#position : "");
    }

    getChildren() { return this.getBlocks(); }

    getFormats() { return []; }

    copy() {
        return new CalloutNode(this.blocks.map(e => e.copy()), this.#position) as this;
    }

    withPosition(position: Position): CalloutNode { return new CalloutNode(this.getBlocks(), position); }

    withChildReplaced(node: Node, replacement: Node | undefined) {
    
        if(!(node instanceof BlockNode) || !(replacement instanceof BlockNode))
            return;

        const index = this.blocks.indexOf(node);
        if(index < 0)
            return;

        const blocks = replacement === undefined ?
            [ ...this.blocks.slice(0, index), ...this.blocks.slice(index + 1)] :
            [ ...this.blocks.slice(0, index), replacement, ...this.blocks.slice(index + 1) ];

        return new CalloutNode(blocks, this.#position) as this;

    }

    create(blocks: BlockNode[]): CalloutNode {
        return new CalloutNode(blocks, this.#position);
    }

}
