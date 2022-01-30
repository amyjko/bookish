import { ChapterNode } from "./ChapterNode";
import { Node } from "./Node";
import { BlockNode } from "./Parser";


export class RuleNode extends Node {
    constructor(parent: ChapterNode | BlockNode) {
        super(parent, "rule");
    }

    toText(): string {
        return "";
    }

    traverseChildren(fn: (node: Node) => void): void {}
    removeChild(node: Node): void {}

}
