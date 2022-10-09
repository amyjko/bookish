import { Node } from "./Node";
import { BlockNode } from "./BlockNode";
import { CaretRange } from "./Caret";

export class RuleNode extends BlockNode {
    
    constructor() {
        super();
    }

    getType() { return "rule"; }
    toText(): string { return ""; }
    toBookdown(): string { return "-"; }
    toHTML() { return `<hr/>`; }
    getParentOf(node: Node): Node | undefined { return undefined; }
    getFormats() { return []; }
    getChildren(): Node[] { return []; }
    copy() { return new RuleNode() as this; }
    withChildReplaced(node: Node, replacement: Node | undefined) { return undefined; }
    withContentInRange(range: CaretRange): this | undefined { return this.copy(); }

}