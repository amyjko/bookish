import { ChapterNode } from "./ChapterNode";
import { Node } from "./Node";


export class ErrorNode extends Node {
    error: string;
    constructor(parent: Node | undefined, error: string) {
        super(parent, "error");
        this.error = error;
    }

    toText(): string {
        return "";
    }

    traverseChildren(fn: (node: Node) => void): void {}
    removeChild(node: Node): void {}

}
