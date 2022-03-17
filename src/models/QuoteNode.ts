import { ChapterNode } from "./ChapterNode";
import { Node } from "./Node";
import { BlockNode, BlockParentNode, Position } from "./Parser";
import { FormattedNode } from "./FormattedNode";
import { BlocksNode } from "./BlocksNode";
import { TextNode } from "./TextNode";

export class QuoteNode extends BlocksNode {
    
    #credit: FormattedNode | undefined;
    #position: Position;

    constructor(parent: BlockParentNode, elements: BlockNode[]) {
        super(parent, elements, "quote");
        this.#position = "|";

        this.#credit = new FormattedNode(this, "", []);
        this.#credit.addSegment(new TextNode(this.#credit, "", 0));
        
    }

    getCredit() { return this.#credit; }
    getPosition() { return this.#position; }

    setCredit(credit: FormattedNode | undefined) {
        this.#credit = credit;
    }

    setPosition(position: Position) {
        this.#position = position;
    }

    toText(): string {
        return this.getBlocks().map(element => element.toText()).join(" ") + (this.#credit ? " " + this.#credit.toText() : "");
    }

    toBookdown(): String {
        return `"\n${this.getBlocks().map(element => element.toBookdown()).join("\n\n")}\n"${this.#position === "|" ? "" : this.#position}${this.#credit ? " " + this.#credit.toBookdown() : ""}`;
    }

    traverseChildren(fn: (node: Node) => void): void {
        this.getBlocks().forEach(item => item.traverse(fn))
        this.#credit?.traverse(fn)
    }

    getSiblingOf(child: Node, next: boolean) {     
        return child === this.#credit ? 
            (next ? undefined : this.getBlocks()[this.getBlocks().length - 1]) : 
            this.getBlocks()[this.getBlocks().indexOf(child as BlockNode ) + (next ? 1 : -1)];
    }

    copy(parent: BlockParentNode) {
        const elements: BlockNode[] = []
        const node = new QuoteNode(parent, elements);
        this.getBlocks().forEach(e => elements.push(e.copy(node as unknown as ChapterNode)));
        return node;
    }

}
