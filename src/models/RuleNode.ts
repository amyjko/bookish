import { CaretPosition, ChapterNode } from "./ChapterNode";
import { Node } from "./Node";
import { BlockNode } from "./Parser";


export class RuleNode extends Node {
    constructor(parent: ChapterNode | BlockNode) {
        super(parent, "rule");
    }

    toText(): string {
        return "";
    }

    toBookdown(): String {
        return "-";
    }

    traverseChildren(fn: (node: Node) => void): void {}
 
    removeChild(node: Node): void {}

    getSiblingOf(child: Node, next: boolean) { return undefined; }

    copy(parent: ChapterNode): RuleNode {
        return new RuleNode(parent)
    }

    deleteBackward(index: number | Node | undefined): CaretPosition | undefined {
        throw Error("Rule deleteBackward not implemented.")
    }

    deleteRange(start: number, end: number): CaretPosition {
        throw new Error("Rule deleteRange not implemented.");
    }
    
    deleteForward(index: number | Node | undefined): CaretPosition | undefined {
        throw new Error("Rule deleteForward not implemented.");
    }

    clean() {}

}
