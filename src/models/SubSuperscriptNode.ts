import { ContentNode } from "./ContentNode";
import { Node } from "./Node";


export class SubSuperscriptNode extends Node {
    superscript: boolean;
    content: ContentNode | undefined;
    constructor(parent: ContentNode, superscript: boolean) {
        super(parent, "script");
        this.superscript = superscript;
    }

    setContent(content: ContentNode) {
        this.content = content;
    }

    toText(): string {
        return this.content ? this.content.toText() : "";
    }

    traverseChildren(fn: (node: Node) => void): void {
        this.content?.traverse(fn)
    }

    removeChild(node: Node): void {}

}
