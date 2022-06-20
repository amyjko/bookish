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
    getListItems() { return this.#items.filter(i => i instanceof ListNode) as ListNode[]; }
    getLength() { return this.#items.length; }
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

    getChildren() { return this.#items; }

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
                    return this.withItemReplaced(index - 1, beforeList.withItemAppended(format))?.withoutItem(index);            
                // If the format is just before a list, move the format to the beginning of the list.
                else if(afterList instanceof ListNode)
                    return this.withItemReplaced(index + 1, afterList.withItemPrepended(format))?.withoutItem(index);
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

    withChildReplaced(node: Node, replacement: Node | undefined): this | undefined {
        if(!(node instanceof FormatNode) && !(node instanceof ListNode)) return;
        if(replacement !== undefined && !(replacement instanceof FormatNode) && !(replacement instanceof ListNode)) return;
        const index = this.#items.indexOf(node);
        if(index < 0) return;
        return new ListNode(replacement === undefined ?
            [ ...this.#items.slice(0, index), ...this.#items.slice(index + 1)] :
            [ ...this.#items.slice(0, index), replacement, ...this.#items.slice(index + 1) ], this.#numbered) as this;
    }

}