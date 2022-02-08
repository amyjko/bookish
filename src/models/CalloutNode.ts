import { CaretPosition, ChapterNode } from "./ChapterNode";
import { Node } from "./Node";
import { BlockNode, BlockParentNode, Position } from "./Parser";

export class CalloutNode extends Node {
    elements: BlockNode[];
    position: Position;

    constructor(parent: BlockParentNode, elements: BlockNode[]) {
        super(parent, "callout");
        this.elements = elements;
        this.position = "|";
    }

    setPosition(position: Position) {
        this.position = position;
    }

    toText(): string {
        return this.elements.map(element => element.toText()).join(" ");
    }

    toBookdown(): string {
        return "=\n" + this.elements.map(element => element.toText()).join("\n\n") + "\n=" + (this.position !== "|" ? this.position : "");
    }

    traverseChildren(fn: (node: Node) => void): void {
        this.elements.forEach(item => item.traverse(fn) )
    }

    removeChild(node: Node) {
        const index = this.elements.indexOf(node as BlockNode);
        if(index >= 0)
            this.elements = this.elements.splice(index, 1);
    }

    getSiblingOf(child: Node, next: boolean) {
        return this.elements[this.elements.indexOf(child as BlockNode) + (next ? 1 : -1)];
    }

    copy(parent: BlockParentNode): CalloutNode {
        const els: BlockNode[] = []
        const node = new CalloutNode(parent, els)
        node.setPosition(this.position)
        this.elements.forEach(e => els.push(e.copy(node as unknown as ChapterNode)));
        return node;
    }

    deleteBackward(index: number | Node | undefined): CaretPosition | undefined {
        throw Error("CalloutNode doesn't know how to backspace.")
    }

    deleteRange(start: number, end: number): CaretPosition {
        throw new Error("Callout deleteRange not implemented.");
    }
    
    deleteForward(index: number | Node | undefined): CaretPosition | undefined {
        throw new Error("Callout deleteForward not implemented.");
    }

    clean() {
        if(this.elements.length === 0) this.remove();
    }

}
