import { MetadataNode } from "./MetadataNode";
import { FormatNode } from "./FormatNode";
import { Node } from "./Node";

export class InlineCodeNode extends MetadataNode<string> {
    constructor(code: string = "", language: string = "plaintext") {
        super(code, language);
    }

    getType() { return "inline-code"; }

    toText(): string {
        return this.getText().getText();
    }

    toBookdown(debug?: number): string {
        return "`" + this.getText().toBookdown(debug).replace(/`/g, '\\`') + "`" + (this.getMeta() === "plaintext" ? "" : this.getMeta());
    }

    copy(): InlineCodeNode { return new InlineCodeNode(this.getText().getText(), this.getMeta()) }

    withChildReplaced(node: Node, replacement: Node | undefined){ return undefined; }

    getParentOf(node: Node): Node | undefined { return undefined; }

    withMeta(meta: string): MetadataNode<string> { return new InlineCodeNode(this.getText().getText(), meta); }
    withText(text: string): MetadataNode<string> { return new InlineCodeNode(text, this.getMeta()); }

}