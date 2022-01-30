import { ChapterNode } from "./ChapterNode";
import { Node } from "./Node";
import { BlockNode, Position } from "./Parser";
import { ContentNode } from "./ContentNode";
import { CalloutNode } from "./CalloutNode";


export class QuoteNode extends Node {
    elements: BlockNode[];
    credit: ContentNode | undefined;
    position: Position;

    constructor(parent: ChapterNode | CalloutNode, elements: Array<BlockNode>) {
        super(parent, "quote");
        this.elements = elements;
        this.position = "|";
    }

    setCredit(credit: ContentNode | undefined) {
        this.credit = credit;
    }

    setPosition(position: Position) {
        this.position = position;
    }

    toText(): string {
        return this.elements.map(element => element.toText()).join(" ") + (this.credit ? " " + this.credit.toText() : "");
    }

    traverseChildren(fn: (node: Node) => void): void {
        this.elements.forEach(item => item.traverse(fn))
        this.credit?.traverse(fn)
    }

    removeChild(node: Node): void {
        this.elements = this.elements.filter(item => item !== node)
    }

}
