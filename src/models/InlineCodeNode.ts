import { ContentNode } from "./ContentNode";
import { Node } from "./Node";


export class InlineCodeNode extends Node {
    code: string;
    language: string;

    constructor(parent: ContentNode, code: string, language: string) {
        super(parent, "inline-code");
        this.code = code;
        this.language = language;
    }

    toText(): string {
        return this.code;
    }

    traverseChildren(fn: (node: Node) => void): void {}

    removeChild(node: Node): void {}

}
