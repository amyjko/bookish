import { Node } from "./Node";
import { ContentNode } from "./ContentNode";
import { ChapterNode } from "./ChapterNode";
import { CalloutNode } from "./CalloutNode";


export class BulletedListNode extends Node {
    items: (ContentNode | BulletedListNode)[];
    constructor(parent: ChapterNode | BulletedListNode | CalloutNode, items: Array<ContentNode | BulletedListNode>) {
        super(parent, "bulleted");
        this.items = items;
    }

    toText(): string {
        return this.items.map(item => item.toText()).join(" ");
    }

    traverseChildren(fn: (node: Node) => void): void {
        this.items.forEach(item => item.traverse(fn) )
    }

    removeChild(node: Node): void {
        this.items = this.items.filter(item => item !== node)
    }

}