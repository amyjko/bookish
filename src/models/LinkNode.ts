import { FormatNode } from "./FormatNode";
import { MetadataNode } from "./MetadataNode";
import { Node } from "./Node";

export class LinkNode extends MetadataNode<string> {
    
    constructor(text: string = "", url: string = "") {
        super(text, url);
    }

    getType() { return "link"; }

    toText(): string {
        return this.getText().toText();
    }

    toBookdown(parent: FormatNode, debug?: number): string {
        return `[${this.getText().toBookdown(this, debug)}|${this.getMeta()}]`;
    }

    copy(): LinkNode {
        return new LinkNode(this.getText().getText(), this.getMeta());
    }

    getParentOf(node: Node): Node | undefined { return undefined; }

    withChildReplaced(node: Node, replacement: Node | undefined) { return undefined; }

    withMeta(meta: string): MetadataNode<string> { return new LinkNode(this.getText().getText(), meta); }
    withText(text: string): MetadataNode<string> { return new LinkNode(text, this.getMeta()); }

}