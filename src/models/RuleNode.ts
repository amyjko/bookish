import { Node } from "./Node";
import { BlockNode } from "./BlockNode";

export class RuleNode extends BlockNode {
    
    constructor() {
        super();
    }

    getType() { return "rule"; }
    toText(): string { return ""; }
    toBookdown(debug?: number): string { return "\n\n-\n\n"; }
    traverseChildren(fn: (node: Node) => void): void {} 
    getParentOf(node: Node): Node | undefined { return undefined; }
    getFormats() { return []; }

    copy(): RuleNode { return new RuleNode(); }
    withChildReplaced(node: Node, replacement: Node | undefined) { return undefined; }

}
