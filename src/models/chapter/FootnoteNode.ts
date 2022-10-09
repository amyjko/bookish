import { FormatNode } from "./FormatNode";
import { AtomNode } from "./AtomNode";
import { Node } from "./Node";
import { Caret, CaretRange } from "./Caret";
import { TextNode } from "./TextNode";

export class FootnoteNode extends AtomNode<FormatNode> {

    constructor(content?: FormatNode) {
        super(content === undefined ? new FormatNode("", [ new TextNode() ]) : content.withTextIfEmpty());
    }

    getType() { return "footnote"; }
    getDefaultCaret(): Caret | undefined { return this.getMeta().getFirstCaret(); }

    toText(): string { return this.getMeta().toText(); }
    toBookdown(): string { return `{${this.getMeta().toBookdown()}}`; }
    toHTML(): string { return `(${this.getMeta().toHTML()})`; }

    copy() { return new FootnoteNode(this.getMeta().copy()) as this; }

    getParentOf(node: Node): Node | undefined {
        return node === this.getMeta() ? this : this.getMeta().getParentOf(node);
    }

    withChildReplaced(node: FormatNode, replacement: FormatNode | undefined) {
        return node === this.getMeta() && replacement !== undefined ?
            new FootnoteNode(replacement) as this :
            undefined;
    }

    withMeta(footnote: FormatNode) { return new FootnoteNode(footnote); }

    withContentInRange(range: CaretRange): this | undefined { 
        const newFormat = this.getMeta().withContentInRange(range);
        if(newFormat === undefined) return;
        return this.withMeta(newFormat) as this;    
    }

}
