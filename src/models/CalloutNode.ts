import { BlocksNode } from "./BlocksNode";
import { Node } from "./Node";
import { BlockNode } from "./BlockNode";
import { BlockParentNode } from "./BlockParentNode";
import { Position } from "./Position";

export class CalloutNode extends BlocksNode<BlockParentNode> {
    
    readonly #position: Position;

    constructor(elements: BlockNode<BlockParentNode>[], position: Position="|") {
        super(elements);
        this.#position = position;
    }

    getType() { return "callout"; }

    getPosition() { return this.#position; }

    toText(): string {
        return this.getBlocks().map(element => element.toText()).join(" ");
    }

    toBookdown(parent: BlockParentNode, debug?: number): string {
        return "=\n" + this.getBlocks().map(element => element.toBookdown(this, debug)).join("\n\n") + "\n=" + (this.#position !== "|" ? this.#position : "");
    }

    traverseChildren(fn: (node: Node) => void): void {
        this.getBlocks().forEach(item => item.traverse(fn) )
    }

    getFormats() { return []; }

    copy(): CalloutNode {
        return new CalloutNode(this.blocks.map(e => e.copy()), this.#position);
    }

    withPosition(position: Position): CalloutNode { return new CalloutNode(this.getBlocks(), position); }

    withChildReplaced(node: Node, replacement: Node | undefined) {
    
        if(!(node instanceof BlockNode) || !(replacement instanceof BlockNode))
            return;

        const index = this.blocks.indexOf(node);
        if(index < 0)
            return undefined;

        const blocks = replacement === undefined ?
            [ ...this.blocks.slice(0, index), ...this.blocks.slice(index + 1)] :
            [ ...this.blocks.slice(0, index), replacement, ...this.blocks.slice(index + 1) ];

        return new CalloutNode(blocks, this.#position);

    }

    create(blocks: BlockNode<BlockParentNode>[]): CalloutNode {
        return new CalloutNode(blocks, this.#position);
    }

}
