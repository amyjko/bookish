import { FormattedNode } from "./FormattedNode";
import { MetadataNode } from "./MetadataNode";

export class LinkNode extends MetadataNode<string> {
    
    constructor(parent: FormattedNode, text: string = "", url: string = "") {
        super(parent, text, url, "link");
    }

    toText(): string {
        return this.getText().toText();
    }

    toBookdown(): String {
        return `[${this.getText().toText()}|${this.getMeta()}]`;
    }

    copy(parent: FormattedNode): LinkNode {
        return new LinkNode(parent, this.getText().getText(), this.getMeta());
    }

}