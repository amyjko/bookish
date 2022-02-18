import { Node } from "./Node";
import { FormattedNode } from "./FormattedNode";
import { BlockParentNode } from "./Parser";


export class HeaderNode extends Node {
    level: number;
    content: FormattedNode | undefined;
    constructor(parent: BlockParentNode, level: number) {
        super(parent, "header");
        this.level = level;
    }

    setContent(content: FormattedNode) {
        this.content = content;
    }

    toText(): string {
        return this.content ? this.content.toText() : "";
    }

    toBookdown(): String {
        return (this.level === 1 ? "#" : this.level === 2 ? "##" : "###") + " " + this.content?.toBookdown();
    }

    traverseChildren(fn: (node: Node) => void): void {
        this.content?.traverse(fn)
    }

    removeChild(node: Node): void {
        if(this.content === node) this.remove();
    }

    replaceChild(node: Node, replacement: Node): void {
        if(this.content === node) this.remove();
    }

    getSiblingOf(child: Node, next: boolean) { return undefined; }

    copy(parent: BlockParentNode): HeaderNode {
        const head = new HeaderNode(parent, this.level);
        if(this.content) head.setContent(this.content.copy(head));
        return head;
    }

    clean() {}
    
}
