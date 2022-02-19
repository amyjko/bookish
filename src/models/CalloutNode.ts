import { ChapterNode } from "./ChapterNode";
import { Node } from "./Node";
import { BlockNode, BlockParentNode, Position } from "./Parser";

export class CalloutNode extends Node<BlockParentNode> {
    
    #blocks: BlockNode[];
    #position: Position;

    constructor(parent: BlockParentNode, elements: BlockNode[]) {
        super(parent, "callout");
        this.#blocks = elements;
        this.#position = "|";
    }

    getBlocks() { return this.#blocks; }
    getPosition() { return this.#position; }

    setPosition(position: Position) {
        this.#position = position;
    }

    toText(): string {
        return this.#blocks.map(element => element.toText()).join(" ");
    }

    toBookdown(): string {
        return "=\n" + this.#blocks.map(element => element.toText()).join("\n\n") + "\n=" + (this.#position !== "|" ? this.#position : "");
    }

    traverseChildren(fn: (node: Node) => void): void {
        this.#blocks.forEach(item => item.traverse(fn) )
    }

    removeChild(node: Node) {
        const index = this.#blocks.indexOf(node as BlockNode);
        if(index >= 0)
            this.#blocks = this.#blocks.splice(index, 1);
    }

    replaceChild(node: Node, replacement: BlockNode): void {
        const index = this.#blocks.indexOf(node as BlockNode);
        if(index < 0) return;
        this.#blocks[index] = replacement;
    }

    getSiblingOf(child: Node, next: boolean) {
        return this.#blocks[this.#blocks.indexOf(child as BlockNode) + (next ? 1 : -1)];
    }

    insertAfter(anchor: BlockNode, block: BlockNode) {
        const index = this.#blocks.indexOf(anchor);
        if(index < 0)
            return;
        this.#blocks.splice(index + 1, 0, block);
    }

    copy(parent: BlockParentNode): CalloutNode {
        const els: BlockNode[] = []
        const node = new CalloutNode(parent, els)
        node.setPosition(this.#position)
        this.#blocks.forEach(e => els.push(e.copy(node as unknown as ChapterNode)));
        return node;
    }

    clean() {
        if(this.#blocks.length === 0) this.remove();
    }

}
