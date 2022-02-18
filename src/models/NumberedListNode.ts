import { Node } from "./Node";
import { FormattedNode } from "./FormattedNode";
import { BlockParentNode } from "./Parser";

export type NumberedListNodeType = FormattedNode | NumberedListNode;

export class NumberedListNode extends Node {
    items: NumberedListNodeType[];
    constructor(parent: BlockParentNode | NumberedListNode, items: Array<FormattedNode | NumberedListNode>) {
        super(parent, "numbered");
        this.items = items;
    }

    getLevel(): number {
        if(this.parent instanceof NumberedListNode)
            return this.parent.getLevel() + 1
        else
            return 1;
    }

    toText(): string {
        return this.items.map(item => item.toText()).join(" ");
    }

    toBookdown(): string {
        return this.items.map((item, number) => (item instanceof NumberedListNode ? "" : ((number + 1) + ".".repeat(this.getLevel())) + " ") + item.toBookdown()).join("\n");
    }

    traverseChildren(fn: (node: Node) => void): void {
        this.items.forEach(item => item.traverse(fn))
    }

    removeChild(node: Node): void {
        this.items = this.items.filter(item => item !== node)
    }

    replaceChild(node: Node, replacement: NumberedListNodeType): void {
        const index = this.items.indexOf(node as NumberedListNodeType);
        if(index < 0) return;
        this.items[index] = replacement;
    }

    getSiblingOf(child: Node, next: boolean) { return this.items[this.items.indexOf(child as NumberedListNodeType ) + (next ? 1 : -1)]; }

    copy(parent: BlockParentNode | NumberedListNode): NumberedListNode {
        const items: NumberedListNodeType[] = [];
        const list = new NumberedListNode(parent, items);
        this.items.forEach(item => items.push(item.copy(list)))
        return list;
    }

    clean() {
        if(this.items.length === 0) this.remove();
    }

}