import { MetadataNode } from "./MetadataNode";
import { TextNode } from "./TextNode";

export class InlineCodeNode extends MetadataNode<string> {
    constructor(code?: TextNode, language: string = "plaintext") {
        super(code === undefined ? new TextNode() : code, language);
    }

    getType() { return "inline-code"; }

    toText(): string {
        return this.getText().getText();
    }
    toHTML() { return `<code>${this.getMeta()}</code>`; }

    toBookdown(): string {
        return "`" + this.getText().toBookdown().replace(/`/g, '\\`') + "`" + (this.getMeta() === "plaintext" ? "" : this.getMeta());
    }

    copy() { return new InlineCodeNode(this.getText(), this.getMeta()) as this }

    withMeta(meta: string): MetadataNode<string> { return new InlineCodeNode(this.getText(), meta); }
    withText(text: TextNode): MetadataNode<string> { return new InlineCodeNode(text, this.getMeta()); }

}