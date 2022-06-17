import { AtomNode } from "./AtomNode";
import { Caret } from "./Caret";
import { FormatNode } from "./FormatNode";
import { Node } from "./Node";

export class CitationsNode extends AtomNode<string[]> {
    constructor(citations: string[]) {
        super(citations);
    }

    getType() { return "citations"; }
    getDefaultCaret(): Caret { return { node: this, index: 0 }; };
    toText(): string { return ""; }
    toBookdown(debug?: number): string { return `${debug === this.nodeID ? "%debug%" : ""}<${this.getMeta().join(",")}>`; }
    getParentOf(node: Node): Node | undefined { return undefined; }
    
    copy(): CitationsNode { return new CitationsNode([...this.getMeta()]); } 
    
    withMeta(citations: string[]) { return new CitationsNode(citations); }
    withChildReplaced(node: Node, replacement: Node){ return undefined; }

}