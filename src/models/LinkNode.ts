import { Node } from "./Node";
import { ContentNode } from "./ContentNode";
import { CaretPosition } from "./ChapterNode";

export class LinkNode extends Node {
    content: ContentNode | undefined;
    url: string | undefined;
    
    constructor(parent: ContentNode) {
        super(parent, "link");
    }

    setContent(content: ContentNode) {
        this.content = content;
    }

    setURL(url: string) {
        this.url = url;
    }

    toText(): string {
        return this.content ? this.content.toText() : "";
    }

    toBookdown(): String {
        return `[${this.content?.toBookdown()}|${this.url}]`
    }

    traverseChildren(fn: (node: Node) => void): void {
        this.content?.traverse(fn)
    }

    removeChild(node: Node): void {}

    replaceChild(node: Node, replacement: Node): void {}
    
    getSiblingOf(child: Node, next: boolean) { return undefined; }

    copy(parent: ContentNode): LinkNode {
        const link = new LinkNode(parent)
        if(this.content) link.setContent(this.content.copy(link))
        if(this.url) link.setURL(this.url)
        return link;
    }

    deleteBackward(index: number | Node | undefined): CaretPosition | undefined {
        throw Error("LinkNode doesn't know how to backspace.")
    }

    deleteRange(start: number, end: number): CaretPosition {
        throw new Error("Link deleteRange not implemented.");
    }
    
    deleteForward(index: number | Node | undefined): CaretPosition | undefined {
        throw new Error("Link deleteForward not implemented.");
    }

    clean() {}

}
