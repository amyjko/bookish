import { FormatNode } from "./FormatNode";
import { MetadataNode } from "./MetadataNode";

export class DefinitionNode extends MetadataNode<string> {
    constructor(parent: FormatNode, phrase: string = "", glossaryID: string = "") {
        super(parent, phrase, glossaryID, "definition");
    }

    toText(): string {
        return this.getText().toText();
    }

    toBookdown(debug?: number): string {
        return `~${this.getText().toBookdown(debug)}~${this.getMeta()}`; 
    }

    copy(): DefinitionNode {
        return new DefinitionNode(this.getParent() as FormatNode, this.getText().getText(), this.getMeta());
    }

}
