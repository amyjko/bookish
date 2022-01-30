import { ChapterNode } from "./ChapterNode";
import { Node } from "./Node";
import { BlockNode, Position } from "./Parser";


export class CalloutNode extends Node {
    elements: BlockNode[];
    position: Position;

    constructor(parent: Node, elements: BlockNode[]) {
        super(parent, "callout");
        this.elements = elements;
        this.position = "|";
    }

    setPosition(position: Position) {
        this.position = position;
    }

    toText(): string {
        return this.elements.map(element => element.toText()).join(" ");
    }

    traverseChildren(fn: (node: Node) => void): void {
        this.elements.forEach(item => item.traverse(fn) )
    }

    removeChild(node: Node): void {
        this.elements = this.elements.filter(item => item !== node)
    }

}
