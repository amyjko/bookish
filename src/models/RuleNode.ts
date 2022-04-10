import { Node } from "./Node";
import { BlockParentNode } from "./BlockParentNode";


export class RuleNode extends Node<BlockParentNode> {
    
    constructor(parent: BlockParentNode) {
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

    replaceChild(node: Node, replacement: Node): void {}

    getSiblingOf(child: Node, next: boolean) { return undefined; }

    copy(parent: BlockParentNode): RuleNode {
        return new RuleNode(parent)
    }

    clean() {}

}
