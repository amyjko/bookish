import { Node } from "./Node";
import { BlockNode, BlockParentNode, NodeType } from "./Parser";

export abstract class BlocksNode extends Node {
    
    #blocks: BlockNode[];

    constructor(parent: BlockParentNode | undefined, elements: BlockNode[], type: NodeType) {
        super(parent, type);
        this.#blocks = elements;
    }

    getBlocks() { return this.#blocks; }

    removeChild(node: Node): void {
        this.#blocks = this.#blocks.filter(item => item !== node)
    }

    replaceChild(node: Node, replacement: BlockNode): void {
        const index = this.#blocks.indexOf(node as BlockNode);
        if(index < 0) return;
        this.#blocks[index] = replacement;
    }

    insertAfter(anchor: BlockNode, block: BlockNode) {
        this.insert(anchor, block, false);
    }

    insertBefore(anchor: BlockNode, block: BlockNode) {
        this.insert(anchor, block, true);
    }

    insert(anchor: BlockNode, block: BlockNode, before: boolean) {
        const index = this.#blocks.indexOf(anchor);
        if(index < 0)
            return;
        this.#blocks.splice(index + (before ? 0 : 1), 0, block);
    }

    append(block: BlockNode) {
        this.#blocks.push(block);
    }

    clean() {
        if(this.#blocks.length === 0) this.remove()
    }

}
