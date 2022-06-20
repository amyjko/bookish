import { FormatNode } from "./FormatNode";
import { AtomNode } from "./AtomNode";
import { Node } from "./Node";
import { Caret } from "./Caret";

export class FootnoteNode extends AtomNode<FormatNode> {

    constructor(content?: FormatNode) {
        super(content ? content : new FormatNode("", []));
    }

    getType() { return "footnote"; }

    getDefaultCaret(): Caret { return this.getMeta().getFirstCaret(); }

    toText(): string { return this.getMeta().toText(); }
    toBookdown(debug?: number): string { return `${debug === this.nodeID ? "%debug%" : ""}{${this.getMeta().toBookdown(debug)}}`; }

    copy() { return new FootnoteNode(this.getMeta().copy()) as this; }

    getParentOf(node: Node): Node | undefined {
        return this.getMeta().getParentOf(node);
    }

    withChildReplaced(node: Node, replacement: Node | undefined) {
        return node instanceof FormatNode && replacement instanceof FormatNode && node === this.getMeta() ?
            new FootnoteNode(replacement) as this :
            undefined;
    }

    withMeta(footnote: FormatNode) { return new FootnoteNode(footnote); }

}
