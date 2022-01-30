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

    traverseChildren(fn: (node: Node) => void): void {}
    removeChild(node: Node): void {}

}
