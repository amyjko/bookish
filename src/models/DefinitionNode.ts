import { FormatNode } from "./FormatNode";
import { MetadataNode } from "./MetadataNode";
import { Node } from "./Node";

export class DefinitionNode extends MetadataNode<string> {
    
    constructor(phrase: string = "", glossaryID: string = "") {
        super(phrase, glossaryID);
    }

    getType() { return "definition"; }

    toText(): string {
        return this.getText().toText();
    }

    toBookdown(parent: FormatNode, debug?: number): string {
        return `~${this.getText().toBookdown(this, debug)}~${this.getMeta()}`; 
    }

    copy(): DefinitionNode {
        return new DefinitionNode(this.getText().getText(), this.getMeta());
    }

    withChildReplaced(node: Node, replacement: Node | undefined){ return undefined; }
    getParentOf(node: Node): Node | undefined { return undefined; }
        
    withMeta(meta: string): MetadataNode<string> { return new DefinitionNode(this.getText().getText(), meta); }
    withText(text: string): MetadataNode<string> { return new DefinitionNode(text, this.getMeta()); }

}
