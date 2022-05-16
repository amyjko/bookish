import { AtomNode } from "./AtomNode";
import { FormatNode } from "./FormatNode";

export class LabelNode extends AtomNode<string> {
    
    constructor(parent: FormatNode, id: string) {
        super(parent, id, "label");
    }

    toText(): string { return ""; }
    // The trailing space is necessary for parsing.
    toBookdown(debug?: number): string { return `:${this.getMeta()}`; }
    copy(parent: FormatNode): LabelNode { return new LabelNode(parent, this.getMeta()); }

}
