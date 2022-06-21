import { AtomNode } from "./AtomNode";
import { Caret } from "./Caret";
import { FormatNode } from "./FormatNode";
import { Node } from "./Node";

const ERROR_PLACEHOLDER = "LABELNOIDERROR";

export class LabelNode extends AtomNode<string> {    
    constructor(newID: string) {
        super(newID === ERROR_PLACEHOLDER ? "" : newID);
    }

    getType() { return "label"; }

    getDefaultCaret(): Caret { return { node: this, index: 0 }; }

    toText(): string { return ""; }

    toBookdown(debug?: number, format?: FormatNode): string {
        const id = this.getMeta();
        const nextText = format?.getNextTextOrAtom(this)?.toBookdown();

        // The trailing space after enables parsing. The error placeholder handles invalid empty label IDs.
        return `${debug === this.nodeID ? "%debug%" : ""}:${id === "" ? ERROR_PLACEHOLDER : id}${nextText?.startsWith(" ") ? "" : " "}`; 
    }

    getParentOf(node: Node): Node | undefined { return undefined; }

    copy() { return new LabelNode(this.getMeta()) as this; }

    withMeta(newID: string) { return new LabelNode(newID); }
    withChildReplaced(node: Node, replacement: Node | undefined){ return undefined; }
    
}