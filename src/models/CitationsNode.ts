import { CaretPosition } from "./ChapterNode";
import { ContentNode } from "./ContentNode";
import { Node } from "./Node";


export class CitationsNode extends Node {
    citations: string[];
    constructor(parent: ContentNode, citations: Array<string>) {
        super(parent, "citations");
        this.citations = citations;
    }

    toText(): string {
        return "";
    }

    toBookdown(): String {
        return "<" + this.citations.join(",") + ">"
    }    

    traverseChildren(fn: (node: Node) => void): void {}

    removeChild(node: Node): void {}
    getSiblingOf(child: Node, next: boolean) { return undefined; }
    replaceChild(node: Node, replacement: Node): void {}

    copy(parent: ContentNode): CitationsNode {
        return new CitationsNode(parent, [...this.citations])
    }

    deleteBackward(index: number | Node | undefined): CaretPosition | undefined {
        throw Error("CitationsNode doesn't know how to backspace.")
    }

    deleteRange(start: number, end: number): CaretPosition {
        throw new Error("Citations deleteRange not implemented.");
    }
    
    deleteForward(index: number | Node | undefined): CaretPosition | undefined {
        throw new Error("Citations deleteForward not implemented.");
    }

    clean() {
        if(this.citations.length === 0) this.remove();
    }

}
