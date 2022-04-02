import { Node } from "./Node";
import { FormattedNode } from "./FormattedNode";
import { BlockParentNode } from "./Parser";

export type ListParentType =  BlockParentNode | ListNode;
export type ListNodeType = FormattedNode | ListNode;

export class ListNode extends Node<ListParentType> {

    #numbered: boolean;
    #items: ListNodeType[];

    constructor(parent: ListParentType, items: Array<FormattedNode | ListNode>, numbered: boolean) {
        super(parent, "list");
        this.#numbered = numbered;
        this.#items = items;
    }

    isNumbered() { return this.#numbered; }

    getItems() { return this.#items; }

    getLevel(): number {
        const parent = this.getParent();
        if(parent instanceof ListNode)
            return parent.getLevel() + 1
        else
            return 1;
    }

    toText(): string {
        return this.#items.map(item => item.toText()).join(" ");
    }

    toBookdown(): string {
        return this.isNumbered() ?
            this.#items.map((item, number) => (item instanceof ListNode ? "" : ((number + 1) + ".".repeat(this.getLevel())) + " ") + item.toBookdown()).join("\n") :
            this.#items.map(item => (item instanceof ListNode ? "" : "*".repeat(this.getLevel()) + " ") + item.toBookdown()).join("\n");
    }

    traverseChildren(fn: (node: Node) => void): void {
        this.#items.forEach(item => item.traverse(fn))
    }

    removeChild(node: Node): void {
        this.#items = this.#items.filter(item => item !== node)
    }

    replaceChild(node: Node, replacement: ListNodeType): void {
        const index = this.#items.indexOf(node as ListNodeType);
        if(index < 0) return;
        this.#items[index] = replacement;
    }

    getSiblingOf(child: Node, next: boolean) { return this.#items[this.#items.indexOf(child as ListNodeType ) + (next ? 1 : -1)]; }

    copy(parent: BlockParentNode | ListNode): ListNode {
        const items: ListNodeType[] = [];
        const list = new ListNode(parent, items, this.#numbered);
        this.#items.forEach(item => items.push(item.copy(list)))
        return list;
    }

    clean() {
        if(this.#items.length === 0) this.remove();
    }

}