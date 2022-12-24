import type Node from "./Node";
import BlockNode from "./BlockNode";
import ListNode from "./ListNode";
import type Caret from "./Caret";
import type { CaretRange } from "./Caret";
import { caretToIndex, indexToCaret } from "./Caret";
import ParagraphNode from "./ParagraphNode";
import type { Format, FormatNodeSegmentType } from "./FormatNode";
import FormatNode from "./FormatNode";
import TextNode from "./TextNode";
import AtomNode from "./AtomNode";
import type Edit from "./Edit";
import CodeNode from "./CodeNode";

export default abstract class BlocksNode extends BlockNode {
    
    readonly #blocks: BlockNode[];

    constructor(elements: BlockNode[]) {
        super();
        const adjustedElements = [];
        for(let i = 0; i < elements.length; i++) {
            const block = elements[i];
            const previousBlock = i === 0 ? undefined : elements[i - 1];
            // If this block and the previous one are lists of the same kind, merge them.
            if(block instanceof ListNode && previousBlock instanceof ListNode && block.isNumbered() === previousBlock.isNumbered()) {
                adjustedElements[adjustedElements.length - 1] = previousBlock.withListAppended(block);
            }
            // Always ensure there's an empty paragraph before and after non-paragraph nodes to allow for insertions.
            // // If the block isn't a paragraph and the last one isn't either or this is the first one, put a paragraph between them to allow for insertion.
            // else {
            //     if(!(block instanceof ParagraphNode) && (i === 0 || !(previousBlock instanceof ParagraphNode)))
            //         adjustedElements.push(new ParagraphNode());
            // }
            else adjustedElements.push(block);
        }
        // Check the last one.
        // if(!(adjustedElements[adjustedElements.length - 1] instanceof ParagraphNode))
        //     adjustedElements.push(new ParagraphNode());

        this.#blocks = adjustedElements;

        // After all that, always ensure there's at least one empty paragraph block.
        if(this.#blocks.length === 0)
            this.#blocks.push(new ParagraphNode());

    }

    getBlocks() { return this.#blocks; }
    getFormats() { return this.getBlocks().reduce((prev: FormatNode[], current) => prev.concat(current.getFormats()), []); }

    getIndexOf(block: BlockNode): number | undefined {
        const index = this.#blocks.indexOf(block);
        return index < 0 ? undefined : index;
    }

    getBlockBefore(anchor: BlockNode): BlockNode | undefined {
        const index = this.#blocks.indexOf(anchor);
        if(index <= 0)
            return undefined;
        return this.#blocks[index - 1];        
    }

    getBlockAfter(anchor: BlockNode): BlockNode | undefined {
        const index = this.#blocks.indexOf(anchor);
        if(index < 0 || index > this.#blocks.length - 2)
            return undefined;
        return this.#blocks[index + 1];
    }

    getBlocksBetween(first: BlockNode, last: BlockNode): BlockNode[] | undefined {

        const firstIndex = this.getIndexOf(first);
        const lastIndex = this.getIndexOf(last);
        if(firstIndex !== undefined && lastIndex !== undefined) {
            // Swap to be in order.
            if(firstIndex > lastIndex) {
                const temp = first;
                first = last;
                last = temp;
            }
            const blocks = [];
            let inside = false;
            for(let i = 0; i < this.#blocks.length; i++) {
                let block = this.#blocks[i];
                if(block === first)
                    inside = true;
                if(inside)
                    blocks.push(block);
                if(block === last)
                    break;
            }
            return blocks;
        }
        return undefined;

    }

    getBlocksInRange(range: CaretRange): BlockNode[] | undefined {

        // Find the start and end block the carets reside in. Bail on fail.
        const startBlock = this.getBlockOfCaret(range.start);
        const endBlock = range.end === range.start ? startBlock : this.getBlockOfCaret(range.end);
        if(startBlock === undefined || endBlock === undefined) return;

        // Find all of the blocks between the start and end blocks.
        // Start tracking when we hit the start node. Stop tracking when we hit the end node.
        const blocksToEdit: BlockNode[] = [];
        let insideSelection = false;
        this.getNodes().filter(n => n instanceof BlockNode).forEach(node => {
            if(node === startBlock) insideSelection = true;
            if(insideSelection && node instanceof BlockNode) blocksToEdit.push(node);
            if(insideSelection && node === endBlock) insideSelection = false;
        });

        return blocksToEdit;

    }

    getBlockOfCaret(caret: Caret): BlockNode | undefined {
        return caret.node.getClosestParentOfType<BlockNode>(this, BlockNode);
    }

    getParentOf(node: Node): Node | undefined {
        return this.#blocks.map(b => b === node ? this : b.getParentOf(node)).find(b => b !== undefined);
    }

    getTextNodes(): TextNode[] {
        return this.getNodes().filter(node => node instanceof TextNode) as TextNode[]
    }

    getAtomNodes(): AtomNode<any>[] {
        return this.getNodes().filter(node => node instanceof AtomNode) as AtomNode<any>[];
    }

    getTextAndAtomNodes(): (TextNode | AtomNode<any>)[] {
        return this.getNodes().filter(node => node instanceof TextNode || node instanceof AtomNode) as (TextNode | AtomNode<any>)[]
    }

    getIndexOfTextNode(node: TextNode): number | undefined {
        const text = this.getTextNodes();
        return text.indexOf(node);
    }

    getFirstCaret(): Caret | undefined {
        const text = this.getTextNodes();
        return text.length === 0 ? undefined : { node: text[0], index: 0 };
    }

    getLastCaret(): Caret | undefined {
        const text = this.getTextNodes();
        return text.length === 0 ? undefined : { node: text[text.length - 1], index: text[text.length - 1].getLength() };
    }
    
    getAdjacentCaret(caret: Caret, next: boolean): Caret | undefined {
    
        if(!this.contains(caret.node)) return;
        
        // Navigate from code node.
        const code = caret.node.getFarthestParentMatching(this, n => n instanceof CodeNode) as CodeNode;
        if(code && caret.node === code.getCodeNode()) {
            // Get the adjacent text node.
            const newCaret = next ? caret.node.getNextCaret(caret.index) : caret.node.getPreviousCaret(caret.index);
            if(newCaret !== undefined) return newCaret;
            // Otherwise, get the adjacent format's first/last caret.
            if(next) return code.getCaption().getFirstCaret();
            // If there's no adjacent caret, find the adjacent root format.
            const blocks = this.getNodes().filter(n => n instanceof BlockNode) as BlockNode[];
            const codeIndex = blocks.indexOf(code);
            if(codeIndex <= 0) return;
            const adjacentBlock = blocks[codeIndex - 1];
            const adjacentFormats = adjacentBlock.getFormats();
            const adjacentFormat = adjacentFormats[adjacentFormats.length - 1];
            return adjacentFormat.getLastCaret();
        }

        const format = caret.node.getFarthestParentMatching(this, n => n instanceof FormatNode) as FormatNode;
        if(format === undefined) return;

        // Find the format that contains the caret and return the adjacent caret if there is one.
        const adjacentCaretInFormat = format.getAdjacentCaret(caret, next);
        if(adjacentCaretInFormat !== undefined) return adjacentCaretInFormat;

        // If there's no adjacent caret in the root format, find the adjacent format or code.
        const formats = this.getNodes().filter(n => {
            const parent = n.getParent(this);
            return (n instanceof TextNode && parent instanceof CodeNode) || (n instanceof FormatNode && !(parent instanceof AtomNode) && !(parent instanceof FormatNode));
        }) as (TextNode | FormatNode)[];

        const index = formats.indexOf(format);
        const adjacentFormat = index < 0 || formats.length === 0 ? undefined : formats[index + (next ? 1 : -1 )];
        if(adjacentFormat === undefined) return;
        return next ? adjacentFormat.getFirstCaret() : adjacentFormat.getLastCaret();
    
    }

    getSelectedFormatRange(format: FormatNode, range: CaretRange): CaretRange | undefined {

        // Find all of the formats.
        const formats = this.getNodes().filter(n => n instanceof FormatNode && !(this.getParentOf(n) instanceof FormatNode)) as FormatNode[];

        // Find the given format index.
        const formatIndex = formats.indexOf(format);
        if(formatIndex < 0) return undefined;

        // Find the range start and end formats.
        const startFormat = formats.find(f => f.contains(range.start.node));
        const endFormat = formats.find(f => f.contains(range.end.node));
        if(startFormat === undefined || endFormat === undefined) return undefined;
        const startIndex = formats.indexOf(startFormat);
        const endIndex = formats.indexOf(endFormat);

        // No range if out of bounds.
        if(startIndex < 0 || endIndex < 0) return undefined;
        if(formatIndex < startIndex || formatIndex > endIndex) return undefined;

        // Choose the portion of the format that is selected.
        const startCaret = formatIndex === startIndex ? range.start : format.getFirstCaret();
        const endCaret = formatIndex === endIndex ? range.end : format.getLastCaret();
        if(startCaret === undefined || endCaret === undefined) return;
        return { start: startCaret, end: endCaret }

    }
 
    abstract create(blocks: BlockNode[]): BlocksNode;

    withContentInRange(range: CaretRange): this | undefined {

        const containsStart = this.contains(range.start.node);
        const containsEnd = this.contains(range.end.node);

        if(!containsStart && !containsEnd) return this.copy();

        let foundStart = false;
        let foundEnd = false;
        const newBlocks: BlockNode[] = [];
        for(let i = 0; i < this.#blocks.length; i++) {
            if(this.#blocks[i].contains(range.start.node)) foundStart = true;
            if( ((containsStart && foundStart) || !containsStart) && 
                ((containsEnd && !foundEnd) || !containsEnd)) {
                const newBlock = this.#blocks[i].withContentInRange(range);
                if(newBlock === undefined) return;
                newBlocks.push(newBlock);
            }
            if(this.#blocks[i].contains(range.end.node)) foundEnd = true;
        }

        return this.create(newBlocks) as this;

    }

    withBlockInserted(anchor: BlockNode, block: BlockNode, before: boolean): BlocksNode | undefined {
        const index = this.#blocks.indexOf(anchor);
        if(index < 0)
            return;
        const newBlocks = this.#blocks.slice();
        newBlocks.splice(index + (before ? 0 : 1), 0, block);
        return this.create(newBlocks);
    }

    withBlockAppended(block: BlockNode): BlocksNode {
        let newBlocks = this.#blocks.slice();
        newBlocks.push(block);
        return this.create(newBlocks);

    }

    withoutBlock(block: BlockNode): BlocksNode {
        return this.create(this.#blocks.filter(n => n !== block));
    }

    withBlockInsertedBefore(anchor: BlockNode, block: BlockNode) {
        return this.withBlockInserted(anchor, block, true);
    }

    withBlockInsertedAfter(anchor: BlockNode, block: BlockNode) {
        return this.withBlockInserted(anchor, block, false);
    }

    withSelectionSplit(range: CaretRange): Edit {

        let caret = range.start;
        let blocks: BlocksNode = this;

        // If there's a selection, remove it before inserting.
        if (range.start.node !== range.end.node || range.start.index !== range.end.index) {
            const edit = blocks.withoutRange(range);
            if(edit === undefined || !(edit.root instanceof BlocksNode)) return;
            blocks = edit.root;
            caret = edit.range.start;
        }
    
        // Find what paragraph the caret is in.
        // There are some contexts with no paragraphs. Return the start range given.
        const paragraph = caret.node.getClosestParentOfType<ParagraphNode>(blocks, ParagraphNode);        
        if(paragraph === undefined) return;

        // Split the paragraph in two.
        const split = paragraph.split(caret);
        if(split === undefined) return;
        const [ first, last ] = split;
        const newCaret = last.getFirstCaret();
        if(newCaret === undefined) return;

        // Find the paragraph's blocks node.
        const paragraphBlocks = paragraph.getParent(blocks);
        if(!(paragraphBlocks instanceof BlocksNode)) return;

        const newBlocks = paragraphBlocks
            .withBlockInsertedBefore(paragraph, first)
            ?.withBlockInsertedAfter(paragraph, last)
            ?.withoutBlock(paragraph);
        if(newBlocks === undefined) return;

        // Replace the paragraphs blocks in these blocks.
        const newRoot = blocks.withNodeReplaced(paragraphBlocks, newBlocks);
        if(newRoot === undefined) return;

        return { root: newRoot, range: { start: newCaret, end: newCaret } };

    }

    withoutRange(range: CaretRange): Edit {
        return this.withRangeFormatted(range, undefined);
    }

    withoutAtom(atom: AtomNode<any>): Edit {

        // Find the format that contains the atom.
        const format = atom.getFarthestParentMatching(this, p => p instanceof FormatNode) as FormatNode | undefined;
        if(format === undefined) return;

        // Find the text or atom node to the left and right of the atom to determine the new caret position.
        const previous = format.getPreviousTextOrAtom(atom);
        const next = format.getNextTextOrAtom(atom);
        const newText = new TextNode();

        // If the format is otherwise empty, replace the atom with an empty text node
        const newFormat = previous === undefined && next == undefined ?
            format.withSegmentReplaced(atom, newText) :
            format.withoutSegment(atom);

        // New caret is left, or right, or empty text.
        const newCaret = { node: previous ? previous : next ? next : newText, index: previous && previous instanceof TextNode ? previous.getLength() : 0 };

        // No format? Fail.
        if(newFormat === undefined) return;

        // Create a new chapter with the revised format.
        const newRoot = this.withNodeReplaced(format, newFormat);
        if(newRoot === undefined) return;

        // Return the edited tree!
        return { root: newRoot, range: { start: newCaret, end: newCaret } };

    }

    withRangeFormatted(range: CaretRange, format: Format | undefined): Edit {

        // Only works on text nodes, atom nodes, and metadata nodes.
        if( !(range.start.node instanceof TextNode || range.start.node instanceof AtomNode) || 
            !(range.end.node instanceof TextNode || range.end.node instanceof AtomNode))
            return;
    
        // Have we selected a single atom node for removal? Remove it and place the caret in the adjacent word.
        if(format === undefined && (range.start.node instanceof AtomNode && range.end.node instanceof AtomNode && range.start.node === range.end.node)) {
            return this.withoutAtom(range.start.node);
        }

        // Preserve the original range, since there are a few cases where we adjust it.
        let adjustedRange = range;

        // If this a single point in format, and we're clearing formatting, adjust the selection to the whole format.
        if(format === "" && range.start.node === range.end.node && range.start.index === range.end.index) {
            const selection = range.start.node.getFormatRoot(this)?.getSelection();
            if(selection === undefined) return;
            adjustedRange = selection;
        }

        // Sort the range if it's out of order, since the algorithm below assumes that it's ordered.
        const sortedRange = this.sortRange(adjustedRange);

        // Remember the start and end text index so we can map it back after editing.
        const startTextIndex = caretToIndex(this, sortedRange.start);
        const endTextIndex = caretToIndex(this, sortedRange.end);

        if(startTextIndex === undefined || endTextIndex === undefined) return;

        // Ask all of the blocks to format themselves, replacing them as we do.
        let newBlocks: this | undefined = this;
        let formattedBlocks: BlockNode[] = [];
        let inRange = false;
        for(let i = 0; i < this.#blocks.length; i++) {
            const block = this.#blocks[i];
            const containsStart = block.contains(sortedRange.start.node);
            const containsEnd = block.contains(sortedRange.end.node);
            if(containsStart || containsEnd || inRange) {
                inRange = true;
                // Compute a proper range based on containment.
                const blockStart = containsStart ? sortedRange.start : block.getFirstCaret();
                const blockEnd = containsEnd ? sortedRange.end : block.getLastCaret();
                if(blockStart === undefined || blockEnd === undefined) return;

                // If we're just going to delete it, then don't bother formatting it.
                if(!containsStart && !containsEnd && format === undefined) {
                    newBlocks = newBlocks.withChildReplaced(block, undefined);
                    if(newBlocks === undefined) return;
                }
                // Otherwise, format it.
                else {
                    const edit = block.withRangeFormatted({ start: blockStart, end: blockEnd }, format);
                    // If we failed to format it, remove it.
                    if(edit === undefined) return;
                    // If we succeeded in formatting it, replace it, otherwise skip it.
                    else {
                        const newBlock = edit.root as BlockNode;
                        // Remember non-empty revised blocks so we can merge things after.
                        if(!newBlock.isEmpty())
                            formattedBlocks.push(newBlock);
                        // Replace the block, or delete it if it's empty.
                        newBlocks = newBlocks.withChildReplaced(block, newBlock.isEmpty() ? undefined: newBlock);
                        if(newBlocks === undefined) return;
                    }
                }
            }
            if(block.contains(sortedRange.end.node))
                inRange = false;
        }

        // If we're deleting and there are two non-empty paragraphs left, merge them.
        if(format === undefined && formattedBlocks.length >= 2) {
            const first = formattedBlocks[0];
            const last = formattedBlocks[formattedBlocks.length - 1];
            if(first instanceof ParagraphNode && last instanceof ParagraphNode) {
                // Replace the first paragraph with the second merged.
                newBlocks = newBlocks.withNodeReplaced(first, first.withContent(first.getFormat().withSegmentsAppended(last.getFormat())));
                if(newBlocks === undefined) return;
                // Remove the last paragraph.
                newBlocks = newBlocks.withNodeReplaced(last, undefined);
                if(newBlocks === undefined) return;
            }
        }

        const startCaret = indexToCaret(newBlocks, startTextIndex);
        // If we deleted, then the end caret should be the same as the start.
        const endCaret = format === undefined ? startCaret : indexToCaret(newBlocks, endTextIndex);

        if(startCaret === undefined || endCaret === undefined) return;

        // Return the new root and the start and end of the range.
        return { root: newBlocks, range: { start: startCaret, end: endCaret } };

    }

    withSegmentAtSelection(range: CaretRange, nodeCreator: (text: string) => FormatNodeSegmentType): Edit {

        let blocks: BlocksNode = this;
        let caret = range.start;

        // Only works at a text node.
        if(!(caret.node instanceof TextNode)) return;

        // Get the nearest FormatNode parent of the selected text. Bail on fail.
        const formatted = caret.node.getClosestParentOfType<FormatNode>(blocks, FormatNode);
        if(formatted === undefined) return;
        
        // Update the format and replace it in the blocks.
        const edit = formatted.withSegmentAtSelection(range, nodeCreator);
        if(edit === undefined || !(edit.root instanceof FormatNode)) return;
        const newBlocks = blocks.withNodeReplaced(formatted, edit.root);
        if(newBlocks === undefined) return;
        return { root: newBlocks, range: edit.range };

    }

    withParagraphsAsLists(range: CaretRange, numbered: boolean): BlocksNode | undefined {

        const sortedRange = this.sortRange(range);
        const blocksInRange = this.getBlocksInRange(sortedRange);
        if(blocksInRange === undefined) return;
        // Only format if every block selected is a paragraph node. Non-paragraphs can't be in lists.
        if(!blocksInRange.every(b => b instanceof ParagraphNode)) return;

        // Split the blocks into groups with shared parents.
        const sequences: ParagraphNode[][] = [[]];
        let previous: ParagraphNode | undefined = undefined;
        blocksInRange.forEach(block => {
            if(previous === undefined || block.getParent(this) === previous.getParent(this))
                sequences[sequences.length - 1].push(block as ParagraphNode);
            else {
                sequences.push([ block as ParagraphNode ])
            }
            previous = block as ParagraphNode;
        });

        // For each sequence, create a list of all of the paragraphs in it.
        let newBlocks: BlocksNode = this;
        for(let i = 0; i < sequences.length; i++) {
            const sequence = sequences[i];
            // Make the new list
            const newList = new ListNode(sequence.map(p => p.getFormat()), numbered);
            // Insert the new list
            const blocksParent: BlocksNode | undefined = sequence[0].getParent(newBlocks) as BlocksNode;
            if(blocksParent === undefined) return;
            let newSequenceBlocks = blocksParent.withBlockInsertedBefore(sequence[0], newList);
            // Remove all of the old paragraphs
            for(let j = 0; j < sequence.length; j++) {
                newSequenceBlocks = newSequenceBlocks?.withoutBlock(sequence[j]);
                if(newSequenceBlocks === undefined) return;
            }
            // Replace the blocks parent with the new blocks.
            const newRoot = newBlocks.withNodeReplaced(blocksParent, newSequenceBlocks);
            if(newRoot === undefined || !(newRoot instanceof BlocksNode)) return;
            newBlocks = newRoot;
        }

        return newBlocks;
    
    }
    
    withListsAsParagraphs(range: CaretRange): BlocksNode | undefined {
        
        let newBlocks: BlocksNode = this;
        const sortedRange = this.sortRange(range);
        const blocksInRange = this.getBlocksInRange(sortedRange);
        if(blocksInRange === undefined) return;
        // Convert all of the lists into their root lists, since we only convert entire lists, not parts of lists.
        const listsInRange = blocksInRange.filter(l => l instanceof ListNode);
        const listRootsInRange = [ ... new Set(listsInRange.map(l => l.getParent(this) instanceof ListNode ? l.getFarthestParentMatching(this, m => m instanceof ListNode) : l).filter(n => n !== undefined)) ] as ListNode[];
        if(listRootsInRange.length === 0) return undefined;

        // For each list in the range, convert all items in range to paragraphs.
        for(let i = 0; i < listRootsInRange.length; i ++) {
            const list = listRootsInRange[i];
            const paragraphs = list.getNodes().filter(n => n instanceof FormatNode).map(f => new ParagraphNode(0, f as FormatNode)) as ParagraphNode[];
            // Insert in reverse order to keep them in order, since the list is our anchor.
            for(let j = paragraphs.length - 1; j >= 0; j--) {
                const paragraph = paragraphs[j];
                const insertedBlocks = newBlocks.withBlockInsertedAfter(list, paragraph);
                if(insertedBlocks === undefined) return;
                newBlocks = insertedBlocks;
            }
            const withoutList = newBlocks.withoutBlock(list);
            if(withoutList === undefined) return;
            newBlocks = withoutList;
        }

        return newBlocks;

    }

    withListsIndented(range: CaretRange, indent: boolean): BlocksNode | undefined {

        let newBlocks: BlocksNode = this;

        // Find all of the formats in list nodes in the range and indent them.
        const ancestor = range.start.node.getCommonAncestor(newBlocks, range.end.node);
        const nodes = ancestor?.getNodes();
        const formats = nodes?.filter(n => n instanceof FormatNode && newBlocks.getParentOf(n) instanceof ListNode) as FormatNode[];
        const startIndex = nodes?.indexOf(range.start.node);
        const endIndex = nodes?.indexOf(range.end.node);
        
        if(formats === undefined || startIndex === undefined || endIndex === undefined) return;
        
        // Loop through the formats in the range and indent or dedent them, constructing a new root.
        const first = startIndex < endIndex ? range.start.node : range.end.node;
        const last = startIndex < endIndex ? range.end.node : range.start.node;
        let inside = false;
        for(let i = 0; i < formats.length; i++) {
            const format = formats[i];
            if(first.hasAncestor(newBlocks, format))
                inside = true;
            // If we're in the selection and the format is in a list, restructure it's list to indent/unindent it.
            if(inside) {
                // Find the root list node of the format.
                const list = format.getFarthestParentMatching(newBlocks, n => n instanceof ListNode);
                if(list instanceof ListNode) {
                    const newList = indent ? list.withItemIndented(format) : list.withItemUnindented(format);
                    if(newList === undefined) return;
                    const blocksWithIndent = newBlocks.withChildReplaced(list, newList);
                    if(blocksWithIndent === undefined) return;
                    newBlocks = blocksWithIndent;
                }
            }
            if(last.hasAncestor(newBlocks, format))
                inside = false;
        }
    
        // We shouldn't need to update the range because we haven't modified the text nodes, just their position.
        return newBlocks;
    
    }

    // This accounts for adjascent lists that end up with the same style.
    withListAsStyle(list: ListNode, numbered: boolean): BlocksNode | undefined {
        return this.withNodeReplaced(list, list.withStyle(numbered));
    }

    // Removes the character before or after the current caret
    withoutAdjacentContent(caret: Caret, next: boolean): Edit | undefined {

        // Confirm that this caret is in this tree. Bail on fail.
        if(!this.contains(caret.node)) return;

        // Find the parents of the node.
        const parents = this.getParentsOf(caret.node);
        while(parents && parents.length > 0) {
            const parent = parents.pop();
            // Ask the format node it's in to edit it, and return if successful.
            if(parent instanceof FormatNode) {
                const editedFormat = parent.withoutCharacter(caret, next);
                // If it failed, let a parent try. Otherwise, just update the format.
                if(editedFormat !== undefined) {
                    const newBlocks = this.withNodeReplaced(parent, editedFormat.root);
                    if(newBlocks === undefined) return;
                    return { root: newBlocks, range: editedFormat.range }
                }
            }
            // If it's a format in the list node, merge with the previous list item
            else if(parent instanceof ListNode) {
                const index = parent.getItemContaining(caret);
                if(index === undefined) break;
                // Merge the item backwards.
                if(parent.getLength() > 1) {
                    const edit = parent.withItemMergedBackwards(index);
                    if(edit === undefined) return;
                    const [ newList, newCaret ] = edit;
                    const newBlocks = this.withNodeReplaced(parent, newList);
                    if(newBlocks === undefined) return;
                    return { root: newBlocks, range: { start: newCaret, end: newCaret } }
                }
                // Convert the remaining list item into a paragraph.
                else if(parents.length > 0 && parents[parents.length - 1] instanceof BlocksNode) {
                    const item = parent.getItem(0);
                    if(!(item instanceof FormatNode)) return;
                    const newParagraph = new ParagraphNode(0, item);
                    const newBlocks = this.withNodeReplaced(parent, newParagraph);
                    const newCaret = newParagraph.getFirstCaret();
                    if(newBlocks === undefined || newCaret === undefined) return;
                    return { root: newBlocks, range: { start: newCaret, end: newCaret } }
                }
            }
            // If it's at the beginning of the paragraph, and there's a previous paragraph, merge with the previous paragraph.
            else if(parent instanceof ParagraphNode) {
                const firstCaret = next ? parent.getLastCaret() : parent.getFirstCaret();
                if(firstCaret === undefined) return;
                const blocks = parents[parents.length - 1] as BlocksNode;
                const adjacentBlock = next ? blocks.getBlockAfter(parent) : blocks.getBlockBefore(parent);
                // Is this the first/last caret of the paragraph and there's an adjascent block? Try deleting something.
                if(firstCaret.node === caret.node && firstCaret.index === caret.index && adjacentBlock !== undefined) {
                    // If the block adjacent this paragraph is a paragraph, merge the paragraph into the adjacent paragraph.
                    if(adjacentBlock instanceof ParagraphNode) {
                        const currentCaret = next ? parent.getLastCaret() : adjacentBlock.getLastCaret();
                        if(currentCaret === undefined) return;
                        const textIndex = next ? caretToIndex(parent.getFormat(), currentCaret) : caretToIndex(adjacentBlock.getFormat(), currentCaret);
                        if(textIndex === undefined) return;
                        const mergedParagraph = next ? adjacentBlock.withParagraphPrepended(parent) : adjacentBlock.withParagraphAppended(parent);
                        if(mergedParagraph === undefined) return;
                        const newBlocks = this.withNodeReplaced(blocks, blocks.withChildReplaced(adjacentBlock, mergedParagraph)?.withoutBlock(parent));
                        if(newBlocks === undefined) return;
                        const newCaret = indexToCaret(mergedParagraph.getFormat(), textIndex);
                        if(newCaret === undefined) return;
                        return { root: newBlocks, range: { start: newCaret, end: newCaret }};
                    }
                    // If the block adjacent is a list node, merge the paragraph to the list's first/last item.
                    else if(adjacentBlock instanceof ListNode) {
                        // If we're going forwards, put the first list item into the paragraph.
                        if(next) {
                            const format = adjacentBlock.getFirstItem();
                            if(format !== undefined) {
                                const newParagraph = parent.withContent(parent.getFormat().withSegmentsAppended(format));
                                const newBlocks = blocks.withNodeReplaced(parent, newParagraph)?.withNodeReplaced(format, undefined);
                                if(newBlocks === undefined) return;
                                return { root: newBlocks, range: { start: caret, end: caret }}
                            }
                        } 
                        // If we're going backwards, get the last format of the list and insert the paragraph's content into it,
                        // then remove the paragraph from the blocks.
                        else {
                            const format = adjacentBlock.getLastItem();
                            if(format !== undefined) {
                                const newFormat = format.withSegmentAppended(parent.getFormat());
                                const newBlocks = blocks.withNodeReplaced(format, newFormat)?.withoutBlock(parent);
                                const newCaret = parent.getFormat().getFirstCaret();
                                if(newBlocks === undefined || newCaret === undefined) return;
                                return { root: newBlocks, range: { start: newCaret, end: newCaret }}
                            }
                        }
                    }
                    // Otherwise, return a root without the previous block, deleting it.
                    else {
                        const newBlocks = this.withNodeReplaced(blocks, blocks.withoutBlock(adjacentBlock));
                        return newBlocks === undefined ? undefined : { root: newBlocks, range: { start: caret, end: caret }}
                    }
                }
            }
        }
        // No parent could handle it. Fail!

    }

    withNodeInserted(caret: Caret, node: Node): Edit {
        // The caret's node must be in this tree.
        if(!this.contains(caret.node)) return;
        // Get the blocks to insert.
        const blocks = node instanceof BlocksNode ? node.getBlocks() : node instanceof BlockNode ? [ node ] : [];
        // If there are none, do nothing.
        if(blocks.length === 0) return;
        // Find the block in this blocks node that contains the caret.
        const anchor = this.#blocks.find(b => b.contains(caret.node));
        if(anchor === undefined) return;

        let lastInsert = anchor;
        let newBlocks: BlocksNode | undefined = this;
        while(blocks.length > 0) {
            // Get the block to insert
            let newBlock = blocks.shift();
            if(newBlock === undefined) return;

            // If we're inserting after the anchor and the anchor is a paragraph and the block to insert is a paragraph, merge them.
            if(lastInsert === anchor && anchor instanceof ParagraphNode && newBlock instanceof ParagraphNode) {
                newBlock = anchor.withParagraphAppended(newBlock);
                if(newBlock === undefined) return;
                newBlocks = newBlocks.withChildReplaced(anchor, newBlock);
            }
            // If we're inserting after the anchor and the anchor is a list and the block to insert is a list, merge them.
            else if(lastInsert === anchor && anchor instanceof ListNode && newBlock instanceof ListNode) {
                const edit = anchor.withNodeInserted(caret, newBlock);
                if(edit === undefined || !(edit.root instanceof BlockNode)) return;
                newBlock = edit.root;
                newBlocks = newBlocks.withChildReplaced(anchor, newBlock);
            }
            // Otherwise just insert the block after the last insert, including if it was the anchor block.
            else {
                newBlocks = newBlocks.withBlockInsertedAfter(lastInsert, newBlock);
            }
            // Bail on fail.
            if(newBlocks === undefined) return;
            // Remember what we inserted so we can insert after it.
            lastInsert = newBlock;
        }

        // Set the caret to the last caret of the last insert, and if there isn't one, insert an empty paragraph so we can.
        const formats = lastInsert.getFormats();
        let newCaret = undefined;
        if(formats.length === 0) {
            const newParagraph = new ParagraphNode(0, new FormatNode("", [ new TextNode() ]));
            newCaret = newParagraph.getFirstCaret();
            newBlocks = newBlocks.withBlockInsertedAfter(lastInsert, newParagraph);
            if(newCaret === undefined || newBlocks === undefined) return;
        }
        else {
            newCaret = formats[formats.length - 1].getLastCaret();
            if(newCaret === undefined) return;
        }

        return { root: newBlocks, range: { start: newCaret, end: newCaret }}

    }

    toHTML() {
        return this.#blocks.map(b => b.toHTML()).join("");
    }

}