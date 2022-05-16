import { AtomNode } from "./AtomNode";
import { FormatNode } from "./FormatNode";

export class CitationsNode extends AtomNode<string[]> {
    
    constructor(parent: FormatNode, citations: string[]) {
        super(parent, citations, "citations");
    }

    toText(): string { return ""; }
    toBookdown(debug?: number): string { return "<" + this.getMeta().join(",") + ">"; }
    copy(parent: FormatNode): CitationsNode { return new CitationsNode(parent, [...this.getMeta()]); }
 
}