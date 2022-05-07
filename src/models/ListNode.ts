import { Node } from "./Node";
import { FormatNode } from "./FormatNode";
import { BlockParentNode } from "./BlockParentNode";
import { Caret } from "./Caret";
import { TextNode } from "./TextNode";
import { ParagraphNode } from "./ParagraphNode";
import { BlocksNode } from "./BlocksNode";

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

    getLastItem(): FormatNode | undefined { return this.getFirstLastItem(false); }
    getFirstItem(): FormatNode | undefined { return this.getFirstLastItem(true); }

    getFirstLastItem(first: boolean): FormatNode | undefined {

        if(this.#items.length === 0)
            return undefined;

        // If it's a format, return it.
        const last = this.#items[first ? 0 : this.getLength() - 1];
        if(last instanceof FormatNode)
            return last;
        
        // Otherwise, recurse into the last item's list.
        return last.getFirstLastItem(first);

    }

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
        // Removing a format node means removing the item from the list.
        this.#items = this.#items.filter(item => item !== node);
        node.setParent(undefined);

        // If the list is empty, it means removing the list.
        if(this.#items.length === 0)
            this.remove();
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

    insertAt(item: ListNodeType, index: number) {
        item.setParent(this);
        this.#items.splice(index, 0, item);
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
            caret.node.hasAncestor(this) &&
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
        const beforeFormat = textBefore?.getFarthestParentMatching(n => n instanceof FormatNode) as FormatNode;
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

    // Generate a new list of paragraph and list nodes where the given formats are in paragraphs instead of in the list.
    unwrap(formats: FormatNode[], container: BlocksNode): (ParagraphNode | ListNode)[] {

        const parent = this.getParent();
        if(parent === undefined)
            return [];

        let blocks: (ParagraphNode | ListNode)[] = [];
        let items: ListNodeType[] = [];
        this.#items.forEach(item => {
            // If it's a list, recursively ask the sublist to construct a new sequence of blocks,
            // then insert any blocks in the blocks list, and any 
            if(item instanceof ListNode) {
                const newBlocks = item.unwrap(formats, container);
                newBlocks.forEach(b => {
                    if(b instanceof ListNode)
                        items.push(b);
                    else
                        blocks.push(b);
                });
            }
            // If it's a format node that's being unwrapped, unwrap it.
            else if(formats.includes(item)) {
                // Create a list out of any pending items.
                if(items.length > 0) {
                    const newList = new ListNode(parent, items, this.#numbered);
                    blocks.push(newList);
                    items = [];
                }
                // Create a paragraph with this format node as content.
                const newParagraph = new ParagraphNode(container, 0);
                newParagraph.setContent(item);
                blocks.push(newParagraph);
            }
            // Otherwise, just add the item.
            else {
                items.push(item);
            }
        });

        // Create a list out of any pending items.
        if(items.length > 0) {
            const newList = new ListNode(parent, items, this.#numbered);
            blocks.push(newList);
        }
        // Return the new list of blocks.
        return blocks;

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
            const index = listParent.getItems().indexOf(this);
            this.removeChild(format);
            listParent.insertAt(format, index);
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