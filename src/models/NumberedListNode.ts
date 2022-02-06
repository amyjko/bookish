import { CaretPosition, ChapterNode } from "./ChapterNode";
import { Node } from "./Node";
import { ContentNode } from "./ContentNode";
import { CalloutNode } from "./CalloutNode";
import { QuoteNode } from "./QuoteNode";

export type NumberedListNodeType = ContentNode | NumberedListNode;

export class NumberedListNode extends Node {
    items: NumberedListNodeType[];
    constructor(parent: ChapterNode | CalloutNode | NumberedListNode | QuoteNode, items: Array<ContentNode | NumberedListNode>) {
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

    getSiblingOf(child: Node, next: boolean) { return this.items[this.items.indexOf(child as NumberedListNodeType ) + (next ? 1 : -1)]; }

    copy(parent: ChapterNode | NumberedListNode | CalloutNode | QuoteNode): NumberedListNode {
        const items: (ContentNode | NumberedListNode)[] = [];
        const list = new NumberedListNode(parent, items);
        this.items.forEach(item => items.push(item.copy(list)))
        return list;
    }

    deleteBackward(index: number | Node | undefined): CaretPosition | undefined {
        throw Error("NumberedListNode doesn't know how to backspace.")
    }

    deleteRange(start: number, end: number): CaretPosition {
        throw new Error("NumberedList deleteRange not implemented.");
    }
    
    deleteForward(index: number | Node | undefined): CaretPosition | undefined {
        throw new Error("NumberedList deleteForward not implemented.");
    }

    clean() {
        if(this.items.length === 0) this.remove();
    }

}