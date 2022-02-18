import { Node } from "./Node";
import { FormattedNode } from "./FormattedNode";
import { BlockParentNode } from "./Parser";

export type BulletedListItemType = FormattedNode | BulletedListNode;

export class BulletedListNode extends Node {
    items: (BulletedListItemType)[];
    constructor(parent: BlockParentNode | BulletedListNode, items: (FormattedNode | BulletedListNode)[]) {
        super(parent, "bulleted");
        this.items = items;
    }

    getLevel(): number {
        if(this.parent instanceof BulletedListNode)
            return this.parent.getLevel() + 1
        else
            return 1;
    }

    toText(): string {
        return this.items.map(item => item.toText()).join(" ");
    }

    toBookdown(): string {
        return this.items.map(item => (item instanceof BulletedListNode ? "" : "*".repeat(this.getLevel()) + " ") + item.toBookdown()).join("\n");
    }

    traverseChildren(fn: (node: Node) => void): void {
        this.items.forEach(item => item.traverse(fn) )
    }

    removeChild(node: Node) {
        const index = this.items.indexOf(node as BulletedListItemType);
        if(index < 0) return;
        this.items = this.items.splice(index, 1);
    }

    replaceChild(node: Node, replacement: BulletedListItemType): void {
        const index = this.items.indexOf(node as BulletedListItemType);
        if(index < 0) return;
        this.items[index] = replacement;
    }

    getSiblingOf(child: Node, next: boolean) {
        return this.items[this.items.indexOf(child as BulletedListItemType) + (next ? 1 : -1)];
    }

    copy(parent: BlockParentNode | BulletedListNode): BulletedListNode {
        const items: BulletedListItemType[] = [];
        const list = new BulletedListNode(parent, items);
        this.items.forEach(item => items.push(item.copy(list)))
        return list;
    }

    clean() {
        if(this.items.length === 0) this.remove();
    }

}