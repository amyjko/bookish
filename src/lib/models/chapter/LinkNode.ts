import MetadataNode from "./MetadataNode";
import TextNode from "./TextNode";

export default class LinkNode extends MetadataNode<string> {
    
    constructor(text?: TextNode, url: string = "") {
        super(text === undefined ? new TextNode() : text, url);
    }

    getType() { return "link"; }

    toText(): string { return this.getText().toText(); }
    toHTML() { return `<a href="${this.getMeta()}">${this.getText().toHTML()}</a>`; }
    toBookdown(): string { return `[${this.getText().toBookdown()}|${this.getMeta()}]`; }

    copy() {
        return new LinkNode(this.getText(), this.getMeta()) as this;
    }

    withMeta(meta: string): MetadataNode<string> { return new LinkNode(this.getText(), meta); }
    withText(text: TextNode): MetadataNode<string> { return new LinkNode(text, this.getMeta()); }

}