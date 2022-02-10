import { CaretPosition, ChapterNode } from "./ChapterNode";
import { Node } from "./Node";
import { BlockParentNode, Position } from "./Parser";
import { ContentNode } from "./ContentNode";

export class EmbedNode extends Node {
    url: string;
    description: string;
    caption: ContentNode;
    credit: ContentNode;
    position: Position;

    constructor(parent: BlockParentNode | undefined, url: string, description: string) {
        super(parent, "embed");
        this.url = url;
        this.description = description;
        this.caption = new ContentNode(this, []);
        this.credit = new ContentNode(this, []);
        this.position = "<";
    }

    toText(): string {
        return this.caption.toText();
    }

    toBookdown(): String {
        return `|${this.url}|${this.description}|${this.caption.toBookdown()}|${this.credit.toBookdown()}|`;
    }

    toJSON() {
        return {
            url: this.url,
            alt: this.description,
            caption: this.caption.toText(),
            credit: this.credit.toText()
        };
    }

    traverseChildren(fn: (node: Node) => void): void {
        this.caption.traverse(fn);
        this.credit.traverse(fn);
    }

    removeChild(node: Node): void {}
    
    replaceChild(node: Node, replacement: Node): void {}

    getSiblingOf(child: Node, next: boolean) { return undefined; }

    copy(parent: BlockParentNode): EmbedNode {
        const node = new EmbedNode(parent, this.url, this.description);
        node.caption = this.caption.copy(this);
        node.credit = this.credit.copy(this);
        node.position = this.position;
        return node;
    }

    deleteBackward(index: number | Node | undefined): CaretPosition | undefined {
        throw Error("EmbedNode doesn't know how to backspace.")
    }

    deleteRange(start: number, end: number): CaretPosition {
        throw new Error("Embed deleteRange not implemented.");
    }
    
    deleteForward(index: number | Node | undefined): CaretPosition | undefined {
        throw new Error("Embed deleteForward not implemented.");
    }

    clean() {}

}