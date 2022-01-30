import { Node } from "./Node";
import { ContentNode } from "./ContentNode";


export class LinkNode extends Node {
    content: ContentNode | undefined;
    url: string | undefined;
    
    constructor(parent: ContentNode) {
        super(parent, "link");
    }

    setContent(content: ContentNode) {
        this.content = content;
    }

    setURL(url: string) {
        this.url = url;
    }

    toText(): string {
        return this.content ? this.content.toText() : "";
    }

    traverseChildren(fn: (node: Node) => void): void {
        this.content?.traverse(fn)
    }

    removeChild(node: Node): void {}
}
