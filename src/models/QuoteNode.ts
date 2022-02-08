import { CaretPosition, ChapterNode } from "./ChapterNode";
import { Node } from "./Node";
import { BlockNode, BlockParentNode, Position } from "./Parser";
import { ContentNode } from "./ContentNode";
import { CalloutNode } from "./CalloutNode";


export class QuoteNode extends Node {
    elements: BlockNode[];
    credit: ContentNode | undefined;
    position: Position;

    constructor(parent: BlockParentNode, elements: Array<BlockNode>) {
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

    toBookdown(): String {
        return `"\n${this.elements.map(element => element.toBookdown()).join("\n\n")}\n"${this.position === "|" ? "" : this.position}${this.credit ? " " + this.credit.toBookdown() : ""}`;
    }

    traverseChildren(fn: (node: Node) => void): void {
        this.elements.forEach(item => item.traverse(fn))
        this.credit?.traverse(fn)
    }

    removeChild(node: Node): void {
        this.elements = this.elements.filter(item => item !== node)
    }

    getSiblingOf(child: Node, next: boolean) {     
        return child === this.credit ? 
            (next ? undefined : this.elements[this.elements.length - 1]) : 
            this.elements[this.elements.indexOf(child as BlockNode ) + (next ? 1 : -1)];
    }

    copy(parent: BlockParentNode) {
        const elements: BlockNode[] = []
        const node = new QuoteNode(parent, elements);
        this.elements.forEach(e => elements.push(e.copy(node as unknown as ChapterNode)));
        return node;
    }

    deleteBackward(index: number | Node | undefined): CaretPosition | undefined {
        throw Error("QuoteNode doesn't know how to backspace.")
    }

    deleteRange(start: number, end: number): CaretPosition {
        throw new Error("Quote deleteRange not implemented.");
    }
    
    deleteForward(index: number | Node | undefined): CaretPosition | undefined {
        throw new Error("Quote deleteForward not implemented.");
    }

    clean() {
        if(this.elements.length === 0) this.remove()
    }

}
