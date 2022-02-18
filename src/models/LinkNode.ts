import { Node } from "./Node";
import { FormattedNode } from "./FormattedNode";

export class LinkNode extends Node {
    content: FormattedNode | undefined;
    url: string | undefined;
    
    constructor(parent: FormattedNode) {
        super(parent, "link");
    }

    setContent(content: FormattedNode) {
        this.content = content;
    }

    setURL(url: string) {
        this.url = url;
    }

    toText(): string {
        return this.content ? this.content.toText() : "";
    }

    toBookdown(): String {
        return `[${this.content?.toBookdown()}|${this.url}]`
    }

    traverseChildren(fn: (node: Node) => void): void {
        this.content?.traverse(fn)
    }

    removeChild(node: Node): void {}

    replaceChild(node: Node, replacement: Node): void {}
    
    getSiblingOf(child: Node, next: boolean) { return undefined; }

    copy(parent: FormattedNode): LinkNode {
        const link = new LinkNode(parent)
        if(this.content) link.setContent(this.content.copy(link))
        if(this.url) link.setURL(this.url)
        return link;
    }

    clean() {}

}
