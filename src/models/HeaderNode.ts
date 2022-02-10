import { CaretPosition, ChapterNode } from "./ChapterNode";
import { Node } from "./Node";
import { ContentNode } from "./ContentNode";
import { BlockParentNode } from "./Parser";


export class HeaderNode extends Node {
    level: number;
    content: ContentNode | undefined;
    constructor(parent: BlockParentNode, level: number) {
        super(parent, "header");
        this.level = level;
    }

    setContent(content: ContentNode) {
        this.content = content;
    }

    toText(): string {
        return this.content ? this.content.toText() : "";
    }

    toBookdown(): String {
        return (this.level === 1 ? "#" : this.level === 2 ? "##" : "###") + " " + this.content?.toBookdown();
    }

    traverseChildren(fn: (node: Node) => void): void {
        this.content?.traverse(fn)
    }

    removeChild(node: Node): void {
        if(this.content === node) this.remove();
    }

    replaceChild(node: Node, replacement: Node): void {
        if(this.content === node) this.remove();
    }

    getSiblingOf(child: Node, next: boolean) { return undefined; }

    copy(parent: BlockParentNode): HeaderNode {
        const head = new HeaderNode(parent, this.level);
        if(this.content) head.setContent(this.content.copy(head));
        return head;
    }

    deleteBackward(index: number | Node | undefined): CaretPosition | undefined {
        throw Error("HeaderNode doesn't know how to backspace.")
    }

    deleteRange(start: number, end: number): CaretPosition {
        throw new Error("Header deleteRange not implemented.");
    }

    deleteForward(index: number | Node | undefined): CaretPosition | undefined {
        throw new Error("Header deleteForward not implemented.");
    }

    clean() {}
    
}
