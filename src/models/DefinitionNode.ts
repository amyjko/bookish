import { Node } from "./Node";
import { FormattedNode } from "./FormattedNode";

export class DefinitionNode extends Node<FormattedNode> {
    #phrase: FormattedNode | undefined;
    #glossaryID: string | undefined;
    constructor(parent: FormattedNode) {
        super(parent, "definition");
    }

    getPhrase() { return this.#phrase; }
    getGlossaryID() { return this.#glossaryID; }

    setPhrase(phrase: FormattedNode) {
        this.#phrase = phrase;
    }

    setGlossaryID(id: string) {
        this.#glossaryID = id;
    }

    toText(): string {
        return this.#phrase ? this.#phrase.toText() : "";
    }

    toBookdown(): String {
        return `~${this.#phrase?.toBookdown()}~${this.#glossaryID}`; 
    }

    traverseChildren(fn: (node: Node) => void): void {
        this.#phrase?.traverse(fn)
    }

    removeChild(node: Node): void {}

    replaceChild(node: Node, replacement: Node): void {}
   
    getSiblingOf(child: Node, next: boolean) { return undefined; }

    copy(): DefinitionNode {
        const def = new DefinitionNode(this.getParent() as FormattedNode);
        if(this.#phrase) def.setPhrase(this.#phrase.copy(def))
        if(this.#glossaryID) def.setGlossaryID(this.#glossaryID)
        return def;
    }

    clean() {
        if(this.#glossaryID && this.#glossaryID.length === 0) this.remove();
    }

}
