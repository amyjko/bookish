import { AtomNode } from "./AtomNode";
import { FormattedNode } from "./FormattedNode";

export class LabelNode extends AtomNode<string> {
    
    constructor(parent: FormattedNode, id: string) {
        super(parent, id, "label");
    }

    toText(): string { return ""; }
    toBookdown(): string { return `:${this.getMeta()}`; }
    copy(parent: FormattedNode): LabelNode { return new LabelNode(parent, this.getMeta()); }

}
