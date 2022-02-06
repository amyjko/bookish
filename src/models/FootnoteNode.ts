import { Node } from "./Node";
import { ContentNode } from "./ContentNode";
import { CaretPosition } from "./ChapterNode";


export class FootnoteNode extends Node {
    footnote: ContentNode | undefined;
    constructor(parent: ContentNode, ) {
        super(parent, "footnote");
        
    }

    setContent(footnote: ContentNode) {
        this.footnote = footnote;
    }

    toText(): string {
        return this.footnote ? this.footnote.toText() : "";
    }

    toBookdown(): String {
        return "{" + this.footnote?.toBookdown() + "}";
    }

    traverseChildren(fn: (node: Node) => void): void {
        this.footnote?.traverse(fn)
    }

    removeChild(node: Node): void {
        if(this.footnote === node) this.remove();
    }

    getSiblingOf(child: Node, next: boolean) { return undefined; }

    copy(parent: ContentNode): FootnoteNode {
        const foot = new FootnoteNode(this.parent as ContentNode);
        if(this.footnote) foot.setContent(this.footnote.copy(foot));
        return foot;
    }

    deleteBackward(index: number | Node | undefined): CaretPosition | undefined {
        throw Error("FootnoteNode doesn't know how to backspace.")
    }

    deleteRange(start: number, end: number): CaretPosition {
        throw new Error("Footnote deleteRange not implemented.");
    }

    deleteForward(index: number | Node | undefined): CaretPosition | undefined {
        throw new Error("Footnote deleteForward not implemented.");
    }

    clean() {}
    
}
