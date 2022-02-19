import { ChapterNode } from "./ChapterNode";
import { Node } from "./Node";
import { BlockNode, BlockParentNode, Position } from "./Parser";
import { FormattedNode } from "./FormattedNode";

export class QuoteNode extends Node<BlockParentNode> {
    
    #blocks: BlockNode[];
    #credit: FormattedNode | undefined;
    #position: Position;

    constructor(parent: BlockParentNode, elements: Array<BlockNode>) {
        super(parent, "quote");
        this.#blocks = elements;
        this.#position = "|";
    }

    getBlocks() { return this.#blocks; }
    getCredit() { return this.#credit; }
    getPosition() { return this.#position; }

    setCredit(credit: FormattedNode | undefined) {
        this.#credit = credit;
    }

    setPosition(position: Position) {
        this.#position = position;
    }

    toText(): string {
        return this.#blocks.map(element => element.toText()).join(" ") + (this.#credit ? " " + this.#credit.toText() : "");
    }

    toBookdown(): String {
        return `"\n${this.#blocks.map(element => element.toBookdown()).join("\n\n")}\n"${this.#position === "|" ? "" : this.#position}${this.#credit ? " " + this.#credit.toBookdown() : ""}`;
    }

    traverseChildren(fn: (node: Node) => void): void {
        this.#blocks.forEach(item => item.traverse(fn))
        this.#credit?.traverse(fn)
    }

    removeChild(node: Node): void {
        this.#blocks = this.#blocks.filter(item => item !== node)
    }

    replaceChild(node: Node, replacement: BlockNode): void {
        const index = this.#blocks.indexOf(node as BlockNode);
        if(index < 0) return;
        this.#blocks[index] = replacement;
    }

    insertAfter(anchor: BlockNode, block: BlockNode) {
        const index = this.#blocks.indexOf(anchor);
        if(index < 0)
            return;
        this.#blocks.splice(index + 1, 0, block);
    }

    getSiblingOf(child: Node, next: boolean) {     
        return child === this.#credit ? 
            (next ? undefined : this.#blocks[this.#blocks.length - 1]) : 
            this.#blocks[this.#blocks.indexOf(child as BlockNode ) + (next ? 1 : -1)];
    }

    copy(parent: BlockParentNode) {
        const elements: BlockNode[] = []
        const node = new QuoteNode(parent, elements);
        this.#blocks.forEach(e => elements.push(e.copy(node as unknown as ChapterNode)));
        return node;
    }

    clean() {
        if(this.#blocks.length === 0) this.remove()
    }

}
