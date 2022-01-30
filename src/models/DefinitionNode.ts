import { Node } from "./Node";
import { ContentNode } from "./ContentNode";


export class DefinitionNode extends Node {
    phrase: ContentNode | undefined;
    glossaryID: string | undefined;
    constructor(parent: ContentNode) {
        super(parent, "definition");
    }

    setPhrase(phrase: ContentNode) {
        this.phrase = phrase;
    }

    setGlossaryID(id: string) {
        this.glossaryID = id;
    }

    toText(): string {
        return this.phrase ? this.phrase.toText() : "";
    }

    traverseChildren(fn: (node: Node) => void): void {
        this.phrase?.traverse(fn)
    }

    removeChild(node: Node): void {}

}
