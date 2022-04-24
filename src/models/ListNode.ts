import { Node } from "./Node";
import { FormatNode } from "./FormatNode";
import { BlockParentNode } from "./BlockParentNode";
import { Caret } from "./Caret";
import { TextNode } from "./TextNode";

export type ListParentType =  BlockParentNode | ListNode;
export type ListNodeType = FormatNode | ListNode;

export class ListNode extends Node<ListParentType> {

    #numbered: boolean;
    #items: ListNodeType[];

    constructor(parent: ListParentType, items: Array<FormatNode | ListNode>, numbered: boolean) {
        super(parent, "list");
        this.#numbered = numbered;
        this.#items = items;
        items.forEach(i => i.setParent(this));
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
        this.#items = this.#items.filter(item => item !== node);
        node.setParent(undefined);

    }

    replaceChild(node: Node, replacement: ListNodeType): void {
        const index = this.#items.indexOf(node as ListNodeType);
        if(index < 0) return;
        this.#items[index] = replacement;
        replacement.setParent(this);
    }

    getSiblingOf(child: Node, next: boolean) { return this.#items[this.#items.indexOf(child as ListNodeType ) + (next ? 1 : -1)]; }

    append(item: ListNodeType) {
        item.setParent(this);
        this.#items.push(item);
    }
    
    insert(item: ListNodeType) {
        item.setParent(this);
        this.#items.unshift(item);
    }

    insertAfter(item: ListNodeType, anchor: ListNodeType) {
        const index = this.#items.indexOf(anchor);
        if(index < 0)
            return;
        item.setParent(this);
        this.#items.splice(index + 1, 0, item);
    }

    insertBefore(item: ListNodeType, anchor: ListNodeType) {
        const index = this.#items.indexOf(anchor);
        if(index < 0)
            return;
        item.setParent(this);
        this.#items.splice(index, 0, item);
    }

    atBeginningOfItem(caret: Caret) {

        const format = caret.node.getFarthestParentMatching(n => n instanceof FormatNode) as FormatNode;

        return format !== undefined &&
            caret.node.hasParent(this) &&
            caret.index === 0 &&
            format.getTextNodes()[0] === caret.node;

    }

    backspaceItemContaining(caret: Caret): Caret {

        // Find the root formatter and chapter
        const node = caret.node;
        const format = caret.node.getFarthestParentMatching(n => n instanceof FormatNode) as FormatNode;
        const index = this.#items.indexOf(format);
        const chapter = format.getChapter();        
        if(!(node instanceof TextNode) || format === undefined || chapter === undefined || index < 0)
            return caret;

        // Find the text node before the deleted item so we can place the caret there.
        const chapterNodes = chapter.getTextNodes();
        const chapterIndex = chapterNodes.indexOf(node);
        const textBefore = chapterNodes[chapterIndex - 1];

        // Find the root format of the text before.
        const beforeFormat = textBefore.getFarthestParentMatching(n => n instanceof FormatNode) as FormatNode;
        if(beforeFormat === undefined)
            return caret;

        // Delete the item from this list.
        this.removeChild(format);

        // Append the format to the previous format.
        const caretAsPosition = beforeFormat.caretToTextIndex(caret);
        beforeFormat.addSegment(format);

        // Place the caret
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
            // Delete items from anchor and after
            copy.#items.splice(index);
        else
            // Delete items from 0 through the anchor
            copy.#items.splice(0, index + 1);
        return copy;

    }

    // Takes the given position, finds the root formatted node it is inside of, 
    // and replaces it with a list that contains the formatted node.
    indent(caret: Caret) {

        if(this.getLevel() >= 3)
            return;

        // Find the root format
        const format = caret.node.getFarthestParentMatching(n => n instanceof FormatNode) as FormatNode;
        const index = this.#items.indexOf(format);

        // If this isn't in this list, do nothing.
        if(format === undefined || index < 0)
            return;

        const beforeList = this.#items[index - 1];
        const afterList = this.#items[index + 1];

        // If the format is just after a list, move the format to the end of the list.
        if(beforeList instanceof ListNode) {
            this.removeChild(format);
            beforeList.append(format);
        }
        // If the format is just before a list, move the format to the beginning of the list.
        else if(afterList instanceof ListNode) {
            this.removeChild(format);
            afterList.insert(format);
        }
        else {
            // Otherwise, make a new list node, add the format to it.
            const newList = new ListNode(this, [], this.isNumbered());

            // Replace the format with this
            this.replaceChild(format, newList);

            // Add the format to the list.
            newList.append(format);
        }

    }

    unindent(caret: Caret) {

        // Find the root format
        const format = caret.node.getFarthestParentMatching(n => n instanceof FormatNode) as FormatNode;
        const index = this.#items.indexOf(format);
        const first = index === 0;
        const last = index === this.#items.length - 1;

        // If this isn't in this list, do nothing.
        if(format === undefined || index < 0)
            return;

        // Find the list parent
        const list = format.getParent() as ListNode;
        const listParent = list?.getParent() as ListNode;

        // Not a list, do nothing!
        if(!(listParent instanceof ListNode))
            return;

        // If first, insert the format before this list.
        if(first) {
            this.removeChild(format);
            listParent.insertBefore(format, this);
        }
        // If last, insert the format after this list.
        else if(last) {
            this.removeChild(format);
            listParent.insertAfter(format, this);
        }
        // Otherwise, split the list and place the format between them.
        else if(list && listParent) {
            const before = list.copy(listParent);
            const after = list.copy(listParent);
            before.#items.splice(index);
            after.#items.splice(0, index + 1);
            listParent.replaceChild(list, format);
            listParent.insertBefore(before, format);
            listParent.insertAfter(after, format);
        }
    
        // Remove this list if it's empty.
        if(this.#items.length === 0)
            this.remove();

    }

    clean() {
        if(this.#items.length === 0) this.remove();
    }

}