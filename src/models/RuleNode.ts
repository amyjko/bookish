import { Node } from "./Node";
import { BlockParentNode } from "./BlockParentNode";
import { BlockNode } from "./BlockNode";

export class RuleNode extends BlockNode<BlockParentNode> {
    
    constructor() {
        super();
    }

    getType() { return "rule"; }
    toText(): string { return ""; }
    toBookdown(parent: BlockParentNode, debug?: number): string { return "-"; }
    traverseChildren(fn: (node: Node) => void): void {} 
    getParentOf(node: Node): Node | undefined { return undefined; }
    getFormats() { return []; }

    copy(): RuleNode { return new RuleNode(); }
    withChildReplaced(node: Node, replacement: Node | undefined) { return undefined; }

}
