import { FormatNode } from "./FormatNode";
import { MetadataNode } from "./MetadataNode";

export class LinkNode extends MetadataNode<string> {
    
    constructor(parent: FormatNode, text: string = "", url: string = "") {
        super(parent, text, url, "link");
    }

    toText(): string {
        return this.getText().toText();
    }

    toBookdown(): String {
        return `[${this.getText().toText()}|${this.getMeta()}]`;
    }

    copy(parent: FormatNode): LinkNode {
        return new LinkNode(parent, this.getText().getText(), this.getMeta());
    }

}