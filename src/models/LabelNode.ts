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

    traverseChildren(fn: (node: Node) => void): void {}
    removeChild(node: Node): void {}
    
}
