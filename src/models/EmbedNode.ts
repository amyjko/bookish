import { Node } from "./Node";
import { BlockParentNode, Position } from "./Parser";
import { FormattedNode } from "./FormattedNode";

export class EmbedNode extends Node {
    url: string;
    description: string;
    caption: FormattedNode;
    credit: FormattedNode;
    position: Position;

    constructor(parent: BlockParentNode | undefined, url: string, description: string) {
        super(parent, "embed");
        this.url = url;
        this.description = description;
        this.caption = new FormattedNode(this, "", []);
        this.credit = new FormattedNode(this, "", []);
        this.position = "<";
    }

    toText(): string {
        return this.caption.toText();
    }

    toBookdown(): String {
        return `|${this.url}|${this.description}|${this.caption.toBookdown()}|${this.credit.toBookdown()}|`;
    }

    toJSON() {
        return {
            url: this.url,
            alt: this.description,
            caption: this.caption.toText(),
            credit: this.credit.toText()
        };
    }

    traverseChildren(fn: (node: Node) => void): void {
        this.caption.traverse(fn);
        this.credit.traverse(fn);
    }

    removeChild(node: Node): void {}
    
    replaceChild(node: Node, replacement: Node): void {}

    getSiblingOf(child: Node, next: boolean) { return undefined; }

    copy(parent: BlockParentNode): EmbedNode {
        const node = new EmbedNode(parent, this.url, this.description);
        node.caption = this.caption.copy(this);
        node.credit = this.credit.copy(this);
        node.position = this.position;
        return node;
    }

    clean() {}

}