import { ChapterNode } from "./ChapterNode";
import { Node } from "./Node";
import { BlockNode } from "./BlockNode";
import { BlockParentNode } from "./BlockParentNode";
import { Position } from "./Position";
import { FormatNode } from "./FormatNode";
import { BlocksNode } from "./BlocksNode";
import { TextNode } from "./TextNode";

export class QuoteNode extends BlocksNode {
    
    #credit: FormatNode | undefined;
    #position: Position;

    constructor(parent: BlockParentNode, elements: BlockNode[]) {
        super(parent, elements, "quote");
        this.#position = "|";

        this.#credit = new FormatNode(this, "", []);
        this.#credit.addSegment(new TextNode(this.#credit, ""));
        
    }

    getCredit() { return this.#credit; }
    getPosition() { return this.#position; }

    setCredit(credit: FormatNode | undefined) {
        this.#credit = credit;
    }

    setPosition(position: Position) {
        this.#position = position;
        this.getChapter()?.changed();
    }

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
