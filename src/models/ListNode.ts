import { Node } from "./Node";
import { FormattedNode } from "./FormattedNode";
import { BlockParentNode } from "./Parser";
import { Caret } from "./ChapterNode";
import { TextNode } from "./TextNode";

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
    setNumbered(numbered: boolean) { this.#numbered = numbered; }

    getItems() { return this.#items; }

    getLength() { return this.#items.length; }

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

    append(item: ListNodeType) {
        item.setParent(this);
        this.#items.push(item);
    }

    insertAfter(item: ListNodeType, anchor: ListNodeType) {
        const index = this.#items.indexOf(anchor);
        if(index < 0)
            return;
        item.setParent(this);
        this.#items.splice(index + 1, 0, item);
    }

    atBeginningOfItem(caret: Caret) {

        const format = caret.node.getFarthestParentMatching(n => n instanceof FormattedNode) as FormattedNode;

        return format !== undefined &&
            caret.node.hasParent(this) &&
            caret.index === 0 &&
            format.getTextNodes()[0] === caret.node;

    }

    backspaceItemContaining(caret: Caret): Caret {

        // Find the root formatter and chpater
        const node = caret.node;
        const format = caret.node.getFarthestParentMatching(n => n instanceof FormattedNode) as FormattedNode;
        const index = this.#items.indexOf(format);
        const chapter = format.getChapter();        
        if(!(node instanceof TextNode) || format === undefined || chapter === undefined || index < 0)
            return caret;

        // Find the text node before the deleted item so we can place the caret there.
        const chapterNodes = chapter.getTextNodes();
        const chapterIndex = chapterNodes.indexOf(node);
        const textBefore = chapterNodes[chapterIndex - 1];

        // Find the root format of the text before.
        const beforeFormat = textBefore.getFarthestParentMatching(n => n instanceof FormattedNode) as FormattedNode;
        if(beforeFormat === undefined)
            return caret;
            
        // Append the format to the previous format.
        const caretAsPosition = beforeFormat.caretToTextIndex(caret);
        beforeFormat.addSegment(format);
        beforeFormat.clean();
        
        // Delete the item from this list.
        this.#items.splice(index, 1);

        const newCaret = beforeFormat.textIndexToCaret(caretAsPosition);
        if(newCaret !== undefined)
            return newCaret;
        const newNodes = beforeFormat.getTextNodes();
        const lastText = newNodes[newNodes.length - 1];
        return { node: lastText, index: lastText.getLength() }
        
    }

    copy(parent: BlockParentNode | ListNode): ListNode {
        const items: ListNodeType[] = [];
        const list = new ListNode(parent, items, this.#numbered);
        this.#items.forEach(item => items.push(item.copy(list)))
        return list;
    }

    copyItemsBeforeAfter(item: ListNodeType, before: boolean): ListNode | undefined {

        const parent = this.getParent();
        const index = this.#items.indexOf(item);
        if(parent === undefined || index < 0)
            return undefined;
        const copy = this.copy(parent);
        if(before)
            copy.#items.splice(index);
        else   
            copy.#items.splice(0, index + 1);
        return copy;

    }

    clean() {
        if(this.#items.length === 0) this.remove();
    }

}