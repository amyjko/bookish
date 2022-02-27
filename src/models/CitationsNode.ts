import { AtomNode } from "./AtomNode";
import { FormattedNode } from "./FormattedNode";

export class CitationsNode extends AtomNode<string[]> {
    
    constructor(parent: FormattedNode, citations: string[]) {
        super(parent, citations, "citations");
    }

    toText(): string { return ""; }
    toBookdown(): string { return "<" + this.getMeta().join(",") + ">"; }
    copy(parent: FormattedNode): CitationsNode { return new CitationsNode(parent, [...this.getMeta()]); }
 
}