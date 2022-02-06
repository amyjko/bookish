import { CaretPosition } from "./ChapterNode";
import { ContentNode } from "./ContentNode";
import { Node } from "./Node";


export class LabelNode extends Node {
    id: string;
    constructor(parent: ContentNode, id: string) {
        super(parent, "label");
        this.id = id;
    }

    getID() { return this.id; }

    toText(): string { return ""; }

    toBookdown(): String {
        return `:${this.id}`;
    }

    traverseChildren(fn: (node: Node) => void): void {}
    
    removeChild(node: Node): void {}
    
    getSiblingOf(child: Node, next: boolean) { return undefined; }

    copy(parent: ContentNode): LabelNode {
        return new LabelNode(parent, this.id)
    }

    deleteBackward(index: number | Node | undefined): CaretPosition | undefined {
        throw Error("LabelNode doesn't know how to backspace.")
    }
    
    deleteRange(start: number, end: number): CaretPosition {
        throw new Error("Label deleteRange not implemented.");
    }
    
    deleteForward(index: number | Node | undefined): CaretPosition | undefined {
        throw new Error("Label deleteForward not implemented.");
    }

    clean() {
        if(this.id.length === 0) this.remove();
    }

}
