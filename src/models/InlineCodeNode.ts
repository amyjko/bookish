import { MetadataNode } from "./MetadataNode";
import { FormattedNode } from "./FormattedNode";

export class InlineCodeNode extends MetadataNode<string> {

    constructor(parent: FormattedNode, code: string = "", language: string = "plaintext") {
        super(parent, code, language, "inline-code");
    }

    toText(): string {
        return this.getText().getText();
    }

    toBookdown(): String {
        return "`" + this.getText().getText().replace(/`/g, '\\`') + "`" + (this.getMeta() === "plaintext" ? "" : this.getMeta());
    }

    copy(parent: FormattedNode): InlineCodeNode {
        return new InlineCodeNode(parent, this.getText().getText(), this.getMeta())
    }

}