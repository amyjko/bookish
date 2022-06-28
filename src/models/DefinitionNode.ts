import { MetadataNode } from "./MetadataNode";
import { TextNode } from "./TextNode";

export class DefinitionNode extends MetadataNode<string> {
    
    constructor(phrase?: TextNode, glossaryID: string = "") {
        super(phrase === undefined ? new TextNode() : phrase, glossaryID);
    }

    getType() { return "definition"; }

    toText(): string {
        return this.getText().toText();
    }

    toBookdown(debug?: number): string {
        return `~${this.getText().toBookdown(debug)}~${this.getMeta()}`; 
    }

    copy() {
        return new DefinitionNode(this.getText(), this.getMeta()) as this;
    }
        
    withMeta(meta: string): MetadataNode<string> { return new DefinitionNode(this.getText(), meta); }
    withText(text: TextNode): MetadataNode<string> { return new DefinitionNode(text, this.getMeta()); }

}