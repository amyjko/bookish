import { Node } from "./Node";
import { ContentNode } from "./ContentNode";
import { CaretPosition, ChapterNode } from "./ChapterNode";
import { CalloutNode } from "./CalloutNode";
import { QuoteNode } from "./QuoteNode";

export type BulletedListItemType = ContentNode | BulletedListNode;

export class BulletedListNode extends Node {
    items: (BulletedListItemType)[];
    constructor(parent: ChapterNode | BulletedListNode | CalloutNode | QuoteNode, items: (ContentNode | BulletedListNode)[]) {
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

    getSiblingOf(child: Node, next: boolean) {
        return this.items[this.items.indexOf(child as BulletedListItemType) + (next ? 1 : -1)];
    }

    copy(parent: ChapterNode | BulletedListNode | CalloutNode | QuoteNode): BulletedListNode {
        const items: (ContentNode | BulletedListNode)[] = [];
        const list = new BulletedListNode(parent, items);
        this.items.forEach(item => items.push(item.copy(list)))
        return list;
    }

    deleteBackward(index: number | Node | undefined): CaretPosition | undefined {
        throw Error("BulletListNode doesn't know how to backspace.")
    }

    deleteRange(start: number, end: number): CaretPosition {
        throw new Error("BulletedList deleteRange not implemented.");
    }
    
    deleteForward(index: number | Node | undefined): CaretPosition | undefined {
        throw new Error("BulletedList deleteForward not implemented.");
    }

    clean() {
        if(this.items.length === 0) this.remove();
    }

}