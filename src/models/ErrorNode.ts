import { CaretPosition } from "./ChapterNode";
import { Node } from "./Node";

export class ErrorNode extends Node {
    text: string | undefined;
    error: string;
    constructor(parent: Node | undefined, text: string | undefined, error: string) {
        super(parent, "error");
        this.text = text;
        this.error = error;
    }

    toText(): string {
        return "";
    }

    toBookdown(): String { return this.text ? this.text : ""; }

    traverseChildren(fn: (node: Node) => void): void {}

    removeChild(node: Node): void {}
    getSiblingOf(child: Node, next: boolean) { return undefined; }

    copy(parent: Node): ErrorNode {
        return new ErrorNode(parent, this.text, this.error);
    }

    deleteBackward(index: number | Node | undefined): CaretPosition | undefined {
        throw Error("ErrorNode doesn't know how to backspace.")
    }

    deleteRange(start: number, end: number): CaretPosition {
        throw new Error("Embed deleteRange not implemented.");
    }
    
    deleteForward(index: number | Node | undefined): CaretPosition | undefined {
        throw new Error("Embed deleteForward not implemented.");
    }

    clean() {}

}
