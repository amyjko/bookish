import { Node } from "./Node";
import { Format, FormatNode } from "./FormatNode";
import { Caret, CaretRange, caretToIndex, indexToCaret } from "./Caret";
import { BlockNode } from "./BlockNode";
import { Edit } from "./Edit";

export type ListNodeType = FormatNode | ListNode;

export class ListNode extends BlockNode {

    readonly #numbered: boolean;
    readonly #items: ListNodeType[];

    constructor(items: Array<FormatNode | ListNode>, numbered: boolean) {
        super();
        this.#numbered = numbered;

        let adjustedItems = items
            // Make sure all format nodes have an empty text.
            .map(i => i instanceof FormatNode ? i.withTextIfEmpty() : i)
            // Strip all empty sublists.
            .filter(i => !i.isEmpty())

        this.#items = adjustedItems;

    }

    getType() { return "list"; }
    isNumbered() { return this.#numbered; }
    isEmpty(): boolean { return this.#items.length === 0 || this.#items.every(i => i instanceof ListNode && i.isEmpty()) }
    getItems() { return this.#items; }
    getChildren() { return this.#items; }
    getListItems() { return this.#items.filter(i => i instanceof ListNode) as ListNode[]; }
    getLength() { return this.#items.length; }
    getLastItem(): FormatNode | undefined { return this.getFirstLastItem(false); }
    getFirstItem(): FormatNode | undefined { return this.getFirstLastItem(true); }
    getFormats(): FormatNode[] { 
        return this.#items.reduce(
            (previous: FormatNode[], current: ListNodeType) => 
                previous.concat(current instanceof FormatNode ? [ current ] : current.getFormats()), []) as FormatNode[];
    }
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

    toBookdown(level: number=1): string {
        return this.isNumbered() ?
            this.#items.map((item, number) => (item instanceof ListNode ? "" : ((number + 1) + ".".repeat(level)) + " ") + item.toBookdown(level + 1)).join("\n") :
            this.#items.map(item => (item instanceof ListNode ? "" : "*".repeat(level) + " ") + item.toBookdown(level + 1)).join("\n");
    }

    toHTML(): string { 
        return this.isNumbered() ?
            `<ol>${this.#items.map(i => `<li>${i.toHTML()}</li>`).join("")}</ol>` :            
            `<ul>${this.#items.map(i => `<li>${i.toHTML()}</li>`).join("")}</ul>`;
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

    getItem(index: number): ListNodeType | undefined {
        if(index < 0 || index >= this.#items.length) return;
        return this.#items[index];
    }

    getFirstCaret(): Caret | undefined { return this.#items.length === 0 ? undefined: this.#items[0].getFirstCaret() }

    copy(): this {
        return new ListNode(this.#items.map(i => i.copy()), this.#numbered) as this;
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
        if(index < 0 || index > this.#items.length) return;
        const newItems = this.#items.slice();
        newItems.splice(index, 0, item);
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

    withoutItemAt(index: number): ListNode | undefined {
        if(index < 0 || index >= this.#items.length) return;
        const newItems = this.#items.slice();
        newItems.splice(index, 1);
        return new ListNode(newItems, this.#numbered);
    }

    withoutItem(item: FormatNode): ListNode | undefined {
        const index = this.#items.indexOf(item);
        if(index < 0) return;
        return this.withoutItemAt(index);
    }

    withListAppended(list: ListNode): ListNode {
        return new ListNode([... this.#items, ...list.#items], this.#numbered);
    }

    withItemMergedBackwards(index: number): [ ListNode, Caret ] | undefined {

        if(index <= 0 || index >= this.#items.length) return;

        const deletedItem = this.#items[index];
        let previousItem = this.#items[index - 1];

        // If we're merging a sublist back into this list, move its
        // remaining format into the previous item.
        if(deletedItem instanceof ListNode) {
            if(previousItem instanceof ListNode) return;
            const itemToMerge = deletedItem.getFirstItem();
            if(itemToMerge === undefined) return;
            const newSubList = deletedItem.withChildReplaced(itemToMerge, undefined);
            if(newSubList === undefined) return;
            const listWithRevisedSublist = this.withChildReplaced(deletedItem, newSubList);
            if(listWithRevisedSublist === undefined) return;
            const lastCaret = previousItem.getLastCaret();
            if(lastCaret === undefined) return;
            const textIndex = caretToIndex(previousItem, lastCaret);
            if(textIndex === undefined) return;
            const mergedItem = previousItem.withSegmentsAppended(itemToMerge);
            const listWithMergedItem = listWithRevisedSublist.withChildReplaced(previousItem, mergedItem);
            if(listWithMergedItem === undefined) return;
            const newCaret = indexToCaret(mergedItem, textIndex);
            if(newCaret === undefined) return;
            return [ listWithMergedItem, newCaret ]
        }
        // If the previous item is a list, find it's last item.
        else if(previousItem instanceof ListNode) {
            const lastItem = previousItem.getLastItem();
            if(lastItem === undefined) return;
            const lastCaret = lastItem.getLastCaret();
            if(lastCaret === undefined) return;
            const newCaretIndex = caretToIndex(lastItem, lastCaret);
            if(newCaretIndex === undefined) return;
            const mergedItem = lastItem.withSegmentsAppended(deletedItem);
            const newSublist = previousItem.withChildReplaced(lastItem, mergedItem);
            if(newSublist === undefined) return;
            const newList = this.withChildReplaced(previousItem, newSublist)?.withoutItemAt(index);
            if(newList === undefined) return;
            const newCaret = indexToCaret(mergedItem, newCaretIndex);
            if(newCaret === undefined) return;
            return [ newList, newCaret ];
        } else {
            const lastCaret = previousItem.getLastCaret();
            if(lastCaret === undefined) return;
            const newCaretIndex = caretToIndex(previousItem, lastCaret);
            if(newCaretIndex === undefined) return;
            const mergedItem = previousItem.withSegmentsAppended(deletedItem);
            const newList = this.withItemReplaced(index - 1, mergedItem)?.withoutItemAt(index);
            if(newList === undefined) return;
            const newCaret = indexToCaret(mergedItem, newCaretIndex);
            if(newCaret === undefined) return;
            return [ newList, newCaret ];
        }
        
    }

    withItemSplit(caret: Caret): ListNode | undefined {

        // Which item contains the caret?
        const item = this.#items.find(i => i instanceof FormatNode && i.contains(caret.node)) as FormatNode | undefined;
        if(item === undefined) return;
        const parts = item.split(caret);
        if(parts === undefined) return;
        const [ first, second ] = parts;
        return this.withItemAfter(second, item)?.withItemAfter(first, item)?.withoutItem(item);

    }

    // Recursively search for the given item and indent it, constructing a new list.
    withItemIndented(format: FormatNode): ListNode | undefined {

        // Check each item in the list to see if it matches...
        for(let index = 0; index < this.#items.length; index++ ) {
            const item = this.#items[index];
            // Base case: does this list contain the item?
            if(item === format) {
                const beforeList = this.#items[index - 1];
                const afterList = this.#items[index + 1];
                // If the format is just after a list, move the format to the end of the list.
                if(beforeList instanceof ListNode)
                    return this.withItemReplaced(index - 1, beforeList.withItemAppended(format))?.withoutItemAt(index);            
                // If the format is just before a list, move the format to the beginning of the list.
                else if(afterList instanceof ListNode)
                    return this.withItemReplaced(index + 1, afterList.withItemPrepended(format))?.withoutItemAt(index);
                // Otherwise, make a new sub list node, add the format to it.
                else
                    return this.withItemReplaced(index, new ListNode([ format ], this.#numbered));
            }
            // If this is a sublist, see if it contains the item, and if so,
            // replace this list with list that has the item indented.
            else if(item instanceof ListNode){
                const newList = item.withItemIndented(format);
                if(newList !== undefined)
                    return this.withItemReplaced(index, newList);    
            }
        }
        // Otherwise, return nothing.

    }

    // Recursively search for the item and unindent it, constructing a new list.
    withItemUnindented(format: FormatNode): ListNode | undefined {

        // Check each sublist in the list to see if any has the item so we can unindent it into this.
        for(let index = 0; index < this.#items.length; index++ ) {
            const list = this.#items[index];
            if(list instanceof ListNode) {
                const match = list.#items.indexOf(format);
                // If we found it in this sublist, extract it here!
                if(match >= 0) {
                    const before = new ListNode(list.#items.slice(0, match), this.#numbered);
                    const after = new ListNode(list.#items.slice(match + 1), this.#numbered);
                    let newItems: ListNodeType[] = this.#items.slice(0, index);
                    if(before.getLength() > 0) newItems.push(before);
                    newItems.push(format);
                    if(after.getLength() > 0) newItems.push(after);
                    newItems = newItems.concat(this.#items.slice(index + 1));
                    return new ListNode(newItems, this.#numbered);
                }
                // If the sublist doesn't have it, see if it's sublist does
                else {
                    const unindented = list.withItemUnindented(format);
                    if(unindented !== undefined)
                        return this.withItemReplaced(index, unindented);
                }
            }
        }
        // Otherwise, return nothing, indicating no match.

    }

    withChildReplaced(node: ListNodeType, replacement: ListNodeType | undefined): this | undefined {
        const index = this.#items.indexOf(node);
        if(index < 0) return;
        return new ListNode(replacement === undefined ?
            [ ...this.#items.slice(0, index), ...this.#items.slice(index + 1)] :
            [ ...this.#items.slice(0, index), replacement, ...this.#items.slice(index + 1) ], this.#numbered) as this;
    }

    withContentInRange(range: CaretRange): this | undefined {
        const containsStart = this.contains(range.start.node);
        const containsEnd = this.contains(range.end.node);
        if(!containsStart && !containsEnd) return this.copy();

        const newItems = [];
        let foundStart = false;
        let foundEnd = false;
        for(let i = 0; i < this.#items.length; i++) {
            if(this.#items[i].contains(range.start.node)) foundStart = true;
            if(((containsStart && foundStart) || !containsStart) &&
               ((containsEnd && !foundEnd) || !containsEnd)) {
                const newItem = this.#items[i].withContentInRange(range);
                if(newItem === undefined) return;
                newItems.push(newItem);
            }
            if(this.#items[i].contains(range.end.node)) foundEnd = true;
        }
        return new ListNode(newItems, this.#numbered) as this;
    }

    withNodeInserted(caret: Caret, node: Node): Edit {
        if(!this.contains(caret.node)) return;
        if(!(node instanceof ListNode)) return;

        // Find the anchor item.
        const anchor = this.#items.find(i => i.contains(caret.node));
        if(anchor === undefined) return;

        const items = node.getItems();

        let lastItem = anchor;
        let newList: ListNode | undefined = this;
        while(items.length > 0) {
            let item = items.shift();
            if(item === undefined) return;
            // Insert all of the node's items into this list, merging the first.
            if(lastItem === anchor) {
                const edit = anchor.withNodeInserted(caret, item);
                if(edit === undefined || !(edit.root instanceof FormatNode)) return;
                item = edit.root;
                newList = newList.withChildReplaced(anchor, item);
            }
            else {
                newList = newList.withItemAfter(item, lastItem);
            }
            if(newList === undefined) return;
            // Remember where we inserted.
            lastItem = item;
        }

        // The caret should be the last item inserted.
        const newCaret = lastItem instanceof FormatNode ? lastItem.getLastCaret() : lastItem.getLastItem()?.getLastCaret();
        if(newCaret === undefined) return;

        return { root: newList, range: { start: newCaret, end: newCaret }}

    }

    withRangeFormatted(range: CaretRange, format: Format | undefined): Edit {

        const sortedRange = this.sortRange(range);
        const itemStart = this.getItemContaining(sortedRange.start);
        const itemEnd = this.getItemContaining(sortedRange.end);
        const edit = super.withRangeFormatted(sortedRange, format);

        // If we were deleting and two list items were involved, merge them.
        if(edit && format === undefined && itemStart !== undefined && itemEnd !== undefined && itemStart !== itemEnd) {
            const newList = edit.root as ListNode;
            const itemIndex = itemEnd - (this.#items.length - newList.#items.length);
            if(itemIndex > 0 && newList.getLength() > 1) {
                // Merge the items, accounting for the new index of the last item.
                const mergedEdit = newList.withItemMergedBackwards(itemIndex);
                if(mergedEdit === undefined) return;
                return { root: mergedEdit[0], range: { start: mergedEdit[1], end: mergedEdit[1] }};
            }
        }

        return edit;

    }

}