import { AtomNode } from "./AtomNode";
import { Caret, CaretRange } from "./Caret";
import { Node } from "./Node";

export class CitationsNode extends AtomNode<string[]> {
    constructor(citations: string[]) {
        super(citations);
    }

    getType() { return "citations"; }
    getDefaultCaret(): Caret { return { node: this, index: 0 }; };
    toText(): string { return ""; }
    toBookdown(): string { return `<${this.getMeta().join(",")}>`; }
    getParentOf(node: Node): Node | undefined { return undefined; }
    
    copy() { return new CitationsNode([...this.getMeta()]) as this; } 
    
    withMeta(citations: string[]) { return new CitationsNode(citations); }
    withChildReplaced(node: Node, replacement: Node){ return undefined; }
    withContentInRange(range: CaretRange): this | undefined { return this.copy(); }

}