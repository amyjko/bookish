import { Node } from "./Node";
import { FormattedNode } from "./FormattedNode";
import { AtomNode } from "./AtomNode";

export class DefinitionNode extends AtomNode<string> {
    constructor(parent: FormattedNode, phrase: string = "", glossaryID: string = "") {
        super(parent, phrase, glossaryID, "definition");
    }

    toText(): string {
        return this.getText().toText();
    }

    toBookdown(): String {
        return `~${this.getText().toBookdown()}~${this.getMeta()}`; 
    }

    copy(): DefinitionNode {
        return new DefinitionNode(this.getParent() as FormattedNode, this.getText().getText(), this.getMeta());
    }

}
