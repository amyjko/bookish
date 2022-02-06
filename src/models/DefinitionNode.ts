import { Node } from "./Node";
import { ContentNode } from "./ContentNode";
import { CaretPosition } from "./ChapterNode";


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

    toBookdown(): String {
        return `~${this.phrase?.toBookdown()}~${this.glossaryID}`; 
    }

    traverseChildren(fn: (node: Node) => void): void {
        this.phrase?.traverse(fn)
    }

    removeChild(node: Node): void {}
    getSiblingOf(child: Node, next: boolean) { return undefined; }

    copy(): DefinitionNode {
        const def = new DefinitionNode(this.parent as ContentNode);
        if(this.phrase) def.setPhrase(this.phrase.copy(def))
        if(this.glossaryID) def.setGlossaryID(this.glossaryID)
        return def;
    }

    deleteBackward(index: number | Node | undefined): CaretPosition | undefined {
        throw Error("DefinitionNode doesn't know how to backspace.")
    }

    deleteRange(start: number, end: number): CaretPosition {
        throw new Error("Definition deleteRange not implemented.");
    }
    
    deleteForward(index: number | Node | undefined): CaretPosition | undefined {
        throw new Error("Definition deleteForward not implemented.");
    }

    clean() {
        if(this.glossaryID && this.glossaryID.length === 0) this.remove();
    }

}
