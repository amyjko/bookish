import { MetadataNode } from "./MetadataNode";
import { FormatNode } from "./FormatNode";

export class InlineCodeNode extends MetadataNode<string> {

    constructor(parent: FormatNode, code: string = "", language: string = "plaintext") {
        super(parent, code, language, "inline-code");
    }

    toText(): string {
        return this.getText().getText();
    }

    toBookdown(debug?: number): string {
        return "`" + this.getText().toBookdown(debug).replace(/`/g, '\\`') + "`" + (this.getMeta() === "plaintext" ? "" : this.getMeta());
    }

    copy(parent: FormatNode): InlineCodeNode {
        return new InlineCodeNode(parent, this.getText().getText(), this.getMeta())
    }

}