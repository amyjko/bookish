import { Node } from "./Node";
import { BlockNode } from "./Parser";

export class ContentNode extends Node {
    segments: Node[];
    constructor(parent: BlockNode | undefined, segments: Node[]) {
        super(parent, "content");
        this.segments = segments;
    }

    toText(): string {
        return this.segments.map(segment => segment.toText()).join(" ");
    }

    traverseChildren(fn: (node: Node) => void): void {
        this.segments.forEach(item => item.traverse(fn))
    }

    removeChild(node: Node): void {
        this.segments = this.segments.filter(item => item !== node)
    }

}