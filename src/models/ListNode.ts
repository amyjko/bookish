import { Node } from "./Node";
import { FormatNode } from "./FormatNode";
import { Caret } from "./Caret";
import { ParagraphNode } from "./ParagraphNode";
import { BlocksNode } from "./BlocksNode";
import { BlockNode } from "./BlockNode";

export type ListParentType =  BlocksNode | ListNode;
export type ListNodeType = FormatNode | ListNode;

export class ListNode extends BlockNode {

    readonly #numbered: boolean;
    readonly #items: ListNodeType[];

    constructor(items: Array<FormatNode | ListNode>, numbered: boolean) {
        super();
        this.#numbered = numbered;
        this.#items = items;

    }

    getType() { return "list"; }

    isNumbered() { return this.#numbered; }

    getItems() { return this.#items; }

    getLastItem(): FormatNode | undefined { return this.getFirstLastItem(false); }
    getFirstItem(): FormatNode | undefined { return this.getFirstLastItem(true); }

    getFormats() { return this.#items.filter(i => i instanceof FormatNode) as FormatNode[]; }

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

    getLevel(root: Node): number {
        const parent = root.getParentOf(this);
        if(parent instanceof ListNode)
            return parent.getLevel(root) + 1;
        else
            return 1;
    }

    toText(): string {
        return this.#items.map(item => item.toText()).join(" ");
    }

    toBookdown(debug?: number, level: number=1): string {
        return this.isNumbered() ?
            this.#items.map((item, number) => (item instanceof ListNode ? "" : ((number + 1) + ".".repeat(level)) + " ") + item.toBookdown(debug, level + 1)).join("\n") :
            this.#items.map(item => (item instanceof ListNode ? "" : "*".repeat(level) + " ") + item.toBookdown(debug, level + 1)).join("\n");
    }

    traverseChildren(fn: (node: Node) => void): void {
        this.#items.forEach(item => item.traverse(fn))
    }

    getParentOf(node: Node): Node | undefined {
        return this.#items.map(b => b === node ? this : b.getParentOf(node)).find(b => b !== undefined);
    }

    atBeginningOfItem(root: Node, caret: Caret) {

        const format = caret.node.getFarthestParentMatching(root, n => n instanceof FormatNode) as FormatNode;

        return format !== undefined &&
            caret.node.hasAncestor(root, this) &&
            caret.index === 0 &&
            format.getTextNodes()[0] === caret.node;

    }

    getItemContaining(caret: Caret): number | undefined {
        const match = this.#items.find(n => n.getParentOf(caret.node) !== undefined);
        if(match === undefined) return undefined;
        const index = this.#items.indexOf(match);
        if(index === undefined) return undefined;
        return index;
    }

    copy(): ListNode {
        return new ListNode(this.#items.map(i => i.copy()), this.#numbered);
    }

    withStyle(numbered: boolean) { 
        return new ListNode(this.#items, numbered); 
    }

    withItemAppended(item: ListNodeType): ListNode {
        return new ListNode([ ... this.#items, item], this.#numbered);
    }
    
    withItemPrepended(item: ListNodeType): ListNode {
        return new ListNode([ item, ... this.#items ], this.#numbered);
    }

    withItemAt(item: ListNodeType, index: number): ListNode | undefined {
        if(index < 0 || index >= this.#items.length)
            return;
        const newItems = this.#items.slice().splice(index, 0, item);
        return new ListNode(newItems, this.#numbered);
    }

    withItemAfter(item: ListNodeType, anchor: ListNodeType): ListNode | undefined {
        const index = this.#items.indexOf(anchor);
        if(index < 0)
            return;
        return this.withItemAt(item, index + 1);
    }

    withItemBefore(item: ListNodeType, anchor: ListNodeType) {
        const index = this.#items.indexOf(anchor);
        if(index < 0)
            return;
        return this.withItemAt(item, index);
    }

    withItemReplaced(index: number, item: ListNodeType): ListNode | undefined {
        if(index < 0 || index >= this.#items.length) return;
        const newItems = this.#items.slice();
        newItems[index] = item;
        return new ListNode(newItems, this.#numbered);
    }

    withoutItem(index: number): ListNode | undefined {
        if(index < 0 || index >= this.#items.length) return;
        const newItems = this.#items.slice();
        newItems.splice(index, 1);
        return new ListNode(newItems, this.#numbered);
    }

    withListAppended(list: ListNode): ListNode {
        return new ListNode([... this.#items, ...list.#items], this.#numbered);
    }

    withItemMergedBackwards(index: number): [ ListNode, Caret ] | undefined {

        if(index <= 0 || index >= this.#items.length) return;

        const deletedItem = this.#items[index];
        const previousItem = this.#items[index - 1];

        if(!(deletedItem instanceof FormatNode) || !(previousItem instanceof FormatNode)) return;

        // Remember where to place the caret.
        const newCaretIndex = previousItem.caretToTextIndex(previousItem.getLastCaret());
        const mergedItem = previousItem.withSegmentsAppended(deletedItem);
        const newList = this.withItemReplaced(index - 1, mergedItem)?.withoutItem(index);
        if(newList === undefined) return;
        const newCaret = mergedItem.textIndexToCaret(newCaretIndex);
        if(newCaret === undefined) return;
        return [ newList, newCaret ];
        
    }

    // Recursively generate a new list of paragraph and list nodes where the given formats are in paragraphs instead of in the list.
    unwrap(formats: FormatNode[], container: BlocksNode): (ParagraphNode | ListNode)[] {

        const parent = container.getParentOf(this) as ListParentType;
        if(parent === undefined) return [];

        function addList(parent: ListParentType, numbered: boolean) {
            if(items.length > 0) {
                const newList = new ListNode(items, numbered);
                blocks.push(newList);
                items = [];
            }
        }

        let blocks: (ParagraphNode | ListNode)[] = [];
        let items: ListNodeType[] = [];
        this.#items.forEach(item => {
            // If it's a list, recursively ask the sub-list to construct a new sequence of blocks,
            // then insert any blocks in the blocks list, and any 
            if(item instanceof ListNode) {
                // Create a list out of any pending items.
                addList(parent, this.#numbered);
                // Unwrap this sub list.
                const newBlocks = item.unwrap(formats, container);
                // Add the items that were unwrapped.
                newBlocks.forEach(b => {
                    if(b instanceof ListNode)
                        items.push(b);
                    else {
                        addList(parent, this.#numbered);
                        blocks.push(b);
                    }
                });
            }
            // If it's a format node that's being unwrapped, unwrap it.
            else if(formats.includes(item)) {
                // Create a list out of any pending items.
                addList(parent, this.#numbered);

                // Create a paragraph with this format node as content.
                blocks.push(new ParagraphNode(0, item));
            }
            // Otherwise, just add the item.
            else {
                items.push(item);
            }
        });

        // Create a list out of any pending items.
        addList(parent, this.#numbered);

        // Return the new list of blocks.
        return blocks;

    }

    // Takes the given position, finds the root formatted node it is inside of, 
    // and replaces it with a list that contains the formatted node.
    indent(format: FormatNode): ListNode | undefined {

        const index = this.#items.indexOf(format);
        if(format === undefined || index < 0) return;

        const beforeList = this.#items[index - 1];
        const afterList = this.#items[index + 1];

        // If the format is just after a list, move the format to the end of the list.
        if(beforeList instanceof ListNode)
            return this.withItemReplaced(index - 1, beforeList.withItemAppended(format))?.withoutItem(index);            
        // If the format is just before a list, move the format to the beginning of the list.
        else if(afterList instanceof ListNode)
            return this.withItemReplaced(index + 1, afterList.withItemPrepended(format))?.withoutItem(index);
        // Otherwise, make a new sub list node, add the format to it.
        else
            return this.withItemReplaced(index, new ListNode([ format ], this.#numbered));

    }

    // Returns a new parent list of this list.
    unindent(root: Node, format: FormatNode): ListNode | undefined {

        // Find the root format
        const index = this.#items.indexOf(format);

        // If this isn't in this list, do nothing.
        if(format === undefined || index < 0) return;

        // Find the list parent
        const parent = root.getParentOf(this);

        // If this list isn't in a list, do nothing. There's nothing to indent.
        if(!(parent instanceof ListNode)) return;

        // Where is this list in the parent list?
        const parentIndex = parent.getItems().indexOf(this);

        // If first, insert the format before this list.
        if(index === 0) {
            const withoutItem = this.withoutItem(index);
            if(withoutItem === undefined) return;
            return withoutItem.getLength() > 0 ? 
                parent.withItemReplaced(parentIndex, withoutItem)?.withItemAt(format, parentIndex) :
                parent.withItemAt(format, parentIndex);
        }
        // If last, insert the format after this list.
        else if(index === this.#items.length - 1) {
            const withoutItem = this.withoutItem(index);
            if(withoutItem === undefined) return;
            return withoutItem.getLength() > 0 ?
                parent.withItemReplaced(parentIndex, withoutItem)?.withItemAt(format, parentIndex + 1) :
                parent.withItemAt(format, parentIndex);
        }
        // Otherwise, split the list and place the format between them.
        else {
            const before = new ListNode(this.#items.slice(index), this.#numbered);
            const after = new ListNode(this.#items.slice(0, index + 1), this.#numbered);
            return parent.withItemBefore(before, this)?.withItemAfter(after, this)?.withItemReplaced(parentIndex, format);
        }
    
    }

    withChildReplaced(node: Node, replacement: Node | undefined) {         
        if(!(node instanceof FormatNode) && !(node instanceof ListNode)) return;
        if(replacement !== undefined && !(replacement instanceof FormatNode) && !(replacement instanceof ListNode)) return;
        const index = this.#items.indexOf(node);
        if(index < 0) return;
        return new ListNode(replacement === undefined ?
            [ ...this.#items.slice(0, index), ...this.#items.slice(index + 1)] :
            [ ...this.#items.slice(0, index), replacement, ...this.#items.slice(index + 1) ], this.#numbered);
    }

}