import { AtomNode } from "./AtomNode";
import { FormatNode } from "./FormatNode";

const ERROR_PLACEHOLDER = "LABELNOIDERROR";

export class LabelNode extends AtomNode<string> {
    
    constructor(parent: FormatNode, id: string) {
        super(parent, id === ERROR_PLACEHOLDER ? "" : id, "label");
    }

    toText(): string { return ""; }

    toBookdown(debug?: number): string {
        const id = this.getMeta();
        // The trailing space after enables parsing. The error placeholder handles invalid empty label IDs.
        return `${debug === this.nodeID ? "%debug%" : ""}:${id === "" ? ERROR_PLACEHOLDER : id} `; 
    }

    copy(parent: FormatNode): LabelNode { return new LabelNode(parent, this.getMeta()); }

}
