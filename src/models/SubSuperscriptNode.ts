import { CaretPosition } from "./ChapterNode";
import { ContentNode } from "./ContentNode";
import { Node } from "./Node";


export class SubSuperscriptNode extends Node {
    superscript: boolean;
    content: ContentNode | undefined;
    constructor(parent: ContentNode, superscript: boolean) {
        super(parent, "script");
        this.superscript = superscript;
    }

    setContent(content: ContentNode) {
        this.content = content;
    }

    toText(): string {
        return this.content ? this.content.toText() : "";
    }

    toBookdown(): String {
        return `^${!this.superscript ? "v" : ""}${this.content?.toBookdown()}^`;
    }

    traverseChildren(fn: (node: Node) => void): void {
        this.content?.traverse(fn)
    }

    removeChild(node: Node): void {
        if(this.content === node) this.remove();
    }

    replaceChild(node: Node, replacement: ContentNode): void {
        if(this.content === node)
            this.content = replacement;
    }

    getSiblingOf(child: Node, next: boolean) { return undefined; }

    copy(parent: ContentNode): SubSuperscriptNode {
        const node = new SubSuperscriptNode(parent, this.superscript)
        if(this.content) node.setContent(this.content.copy(node));
        return node;
    }

    deleteBackward(index: number | Node | undefined): CaretPosition | undefined {
        throw Error("SubSuperscript deleteBackward not implemented.")
    }

    deleteRange(start: number, end: number): CaretPosition {
        throw new Error("SubSuperscript deleteRange not implemented.");
    }
    
    deleteForward(index: number | Node | undefined): CaretPosition | undefined {
        throw new Error("SubSuperscript deleteForward not implemented.");
    }

    clean() {}

}
