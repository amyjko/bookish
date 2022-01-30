import { ChapterNode } from "./ChapterNode";
import { Node } from "./Node";
import { ContentNode } from "./ContentNode";
import { CalloutNode } from "./CalloutNode";


export class NumberedListNode extends Node {
    items: (ContentNode | NumberedListNode)[];
    constructor(parent: ChapterNode | CalloutNode | NumberedListNode, items: Array<ContentNode | NumberedListNode>) {
        super(parent, "numbered");
        this.items = items;
    }

    toText(): string {
        return this.items.map(item => item.toText()).join(" ");
    }

    traverseChildren(fn: (node: Node) => void): void {
        this.items.forEach(item => item.traverse(fn))
    }

    removeChild(node: Node): void {
        this.items = this.items.filter(item => item !== node)
    }

}