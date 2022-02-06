import { CaretPosition } from "./ChapterNode";
import { Node } from "./Node";

export class CommentNode extends Node {

    comment: string;

    constructor(parent: Node, comment: string) {
        super(parent, "comment");
        this.comment = comment;
    }

    toText(): String {
        return "";
    }

    toBookdown(): String {
        return "%" + this.comment + "%";
    }

    traverseChildren(fn: (node: Node) => void): void {}

    copy(parent: Node): Node { return new CommentNode(parent, this.comment); }

    removeChild(node: Node): void {}

    getSiblingOf(child: Node, next: boolean): Node | undefined { return undefined; }

    deleteBackward(index: number | Node | undefined): CaretPosition | undefined {
        throw new Error("Method not implemented.");
    }

    deleteRange(start: number, end: number): CaretPosition {
        throw new Error("Method not implemented.");
    }

    deleteForward(index: number | Node | undefined): CaretPosition | undefined {
        throw new Error("Method not implemented.");
    }

    clean(): void {}

}