import { Node } from "./Node";
import { BlockNode } from "./BlockNode";
import { ListNode } from "./ListNode";
import { Caret, CaretRange } from "./Caret";
import { ParagraphNode } from "./ParagraphNode";
import { Format, FormatNode, FormatNodeSegmentType } from "./FormatNode";
import { TextNode } from "./TextNode";
import { AtomNode } from "./AtomNode";
import { MetadataNode } from "./MetadataNode";
import { Edit } from "./Edit";

export abstract class BlocksNode extends BlockNode {
    
    readonly blocks: BlockNode[];

    constructor(elements: BlockNode[]) {
        super();
        this.blocks = elements;
    }

    getBlocks() { return this.blocks; }

    getIndexOf(block: BlockNode): number | undefined {
        const index = this.blocks.indexOf(block);
        return index < 0 ? undefined : index;
    }

    getBlockBefore(anchor: BlockNode): BlockNode | undefined {
        const index = this.blocks.indexOf(anchor);
        if(index <= 0)
            return undefined;
        return this.blocks[index - 1];        
    }

    getBlockAfter(anchor: BlockNode): BlockNode | undefined {
        const index = this.blocks.indexOf(anchor);
        if(index < 0 || index > this.blocks.length - 2)
            return undefined;
        return this.blocks[index + 1];
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
            for(let i = 0; i < this.blocks.length; i++) {
                let block = this.blocks[i];
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
        return this.blocks.map(b => b === node ? this : b.getParentOf(node)).find(b => b !== undefined);
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

    getSelectedText(range: CaretRange): string | undefined {

        if(!(range.start.node instanceof TextNode) || !(range.end.node instanceof TextNode))
            return undefined;

        const start = this.getIndexOfTextNode(range.start.node);
        const end = this.getIndexOfTextNode(range.end.node);

        if(start === undefined || end === undefined)
            return undefined;

        return this.getTextNodes().map((current, index) => {
            return current === range.start.node ? (
                    current === range.end.node ? 
                        current.getText().substring(range.start.index, range.end.index) : 
                        current.getText().substring(range.start.index)) :
                index > start && index < end ? current.getText() :
                current === range.end.node ? current.getText().substring(0, range.end.index) :
                "";
        }).join("");
        
    }

    getTextAndAtomsAsTaggedText(nodeID: number) {
        return this.getTextAndAtomNodes().map(node => node.toBookdown(nodeID)).join("");
    }

    // Convert node and index into text index by converting to Bookdown and then finding the index of the node.
    getTextIndexOfCaret(caret: Caret): number {
        // Get a list of all text and atom nodes, map them to just text with a marker for the matching node,
        // find the index of that marker, and add the caret's index.
        return this.getTextAndAtomsAsTaggedText(caret.node.nodeID).indexOf("%debug%") + caret.index;
    }

    getTextIndexAsCaret(textIndex: number): Caret | undefined {

        const nodes = this.getTextAndAtomNodes();

        // Find the first node that contains the given text index.
        const matches = nodes.filter(node => {
            const index = this.getTextAndAtomsAsTaggedText(node.nodeID).indexOf("%debug%");
            return textIndex >= index && textIndex <= index + node.getLength();
        });

        if(matches.length > 0) {
            // If we found multiple matches, prefer the empty node.
            const empty = matches.find(m => m instanceof TextNode && m.isEmpty());
            const match = empty !== undefined ? empty : matches[0];

            // If we found match, return a corresponding caret by converting this whole
            // node to a bookdown string and then finding the index of the match in the string,
            // then subtracting the match from the given text index in the string.
            return { node: match, index: textIndex - nodes.map(node => node.toBookdown(match.nodeID)).join("").indexOf("%debug%") };
        }

    }

    getAdjacentCaret(caret: Caret, next: boolean): Caret | undefined {
    
        if(!this.contains(caret.node)) return;

        const format = caret.node.getFarthestParentMatching(this, n => n instanceof FormatNode) as FormatNode;
        if(!(format instanceof FormatNode)) return;

        // Find the format that contains the caret and return the adjacent caret if there is one.
        const adjacentCaretInFormat = format.getAdjacentCaret(caret, next);
        if(adjacentCaretInFormat !== undefined) return adjacentCaretInFormat;

        // If there's no adjacent caret, find the adjascent root format.
        const formats = this.getNodes().filter(n => {
            const parent = n.getParent(this);
            return n instanceof FormatNode && !(parent instanceof AtomNode) && !(parent instanceof FormatNode);
        }) as FormatNode[];
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

    // Swap them order if this is two text nodes that are reversed.
    // TODO this should really be encapsulated with a caret range object of some sort, rather than here.
    sortRange(range: CaretRange): CaretRange {

        const start = range.start.node;
        const end = range.end.node;

        // Find the common ancestor of the two nodes.
        const ancestor = start.getCommonAncestor(this, end);

        if(ancestor === undefined)
            return range;

        // Where do these text nodes appear in the ancestor's node sequence?
        let startIndex = ancestor.getNodes().indexOf(start);
        let endIndex = ancestor.getNodes().indexOf(end);

        // Defensively verify that we could find the given nodes in the document.
        // If we can't, something is wrong upstream.
        if(startIndex < 0 || endIndex < 0)
            throw Error(`Couldn't find caret range node(s) in this tree.`);

        // If we didn't find them, or the start is before the end, return the given range.
        return startIndex === undefined || endIndex === undefined || startIndex < endIndex ? 
                range :
            // If they're the same node, order the index.
            startIndex === endIndex ? 
                { 
                    start: { 
                        node: range.start.node, 
                        index: Math.min(range.start.index, range.end.index)
                    }, 
                    end: {
                        node: range.end.node, 
                        index: Math.max(range.start.index, range.end.index)
                    }
                } :
            // Otherwise, swap the caret positions
            { start: range.end, end: range.start };

    }
 
    abstract create(blocks: BlockNode[]): BlocksNode;

    withContentInRange(range: CaretRange): this | undefined {

        const containsStart = this.contains(range.start.node);
        const containsEnd = this.contains(range.end.node);

        if(!containsStart && !containsEnd) return this.copy();

        let foundStart = false;
        let foundEnd = false;
        const newBlocks: BlockNode[] = [];
        for(let i = 0; i < this.blocks.length; i++) {
            if(this.blocks[i].contains(range.start.node)) foundStart = true;
            if( ((containsStart && foundStart) || !containsStart) && 
                ((containsEnd && !foundEnd) || !containsEnd)) {
                const newBlock = this.blocks[i].withContentInRange(range);
                if(newBlock === undefined) return;
                newBlocks.push(newBlock);
            }
            if(this.blocks[i].contains(range.end.node)) foundEnd = true;
        }

        return this.create(newBlocks) as this;

    }

    withBlocksInserted(caret: Caret, blocks: BlocksNode): Edit {

        //   If the caret's format node root is not in a blocks node
        //     Bail; we can't insert things into it.
        //   Otherwise...
        //     If the first block is a paragraph
        //       Merge it's format into the current format
        //     Otherwise
        //       Add it after the current paragraph
        //     Add the rest of the blocks after the paragraph inserted or inserted into
        // Return the revised blocks node.

        // If a format, insert the format’s segments in the current format, and if blocks, 
        // combine the first block with the current block, and insert additional blocks after it
        return { root: this.copy(), range: { start: caret, end: caret }}
    }

    withBlockInserted(anchor: BlockNode, block: BlockNode, before: boolean): BlocksNode | undefined {
        const index = this.blocks.indexOf(anchor);
        if(index < 0)
            return;
        const newBlocks = this.blocks.slice();
        newBlocks.splice(index + (before ? 0 : 1), 0, block);
        return this.create(newBlocks);
    }

    withBlockAppended(block: BlockNode): BlocksNode {
        let newBlocks = this.blocks.slice();
        newBlocks.push(block);
        return this.create(newBlocks);

    }

    withoutBlock(block: BlockNode): BlocksNode {
        return this.create(this.blocks.filter(n => n !== block));
    }

    withBlockInsertedBefore(anchor: BlockNode, block: BlockNode) {
        return this.withBlockInserted(anchor, block, true);
    }

    withBlockInsertedAfter(anchor: BlockNode, block: BlockNode) {
        return this.withBlockInserted(anchor, block, false);
    }

    withAdjacentListsMerged(): BlocksNode {

        const newBlocks: BlockNode[] = [];
        this.blocks.forEach(block => {
            const previousBlock = newBlocks[newBlocks.length - 1];
            // Are these two adjacent lists of the same style? Put all of the current block's list items in the previous block.
            if(previousBlock instanceof ListNode && block instanceof ListNode && previousBlock.isNumbered() === block.isNumbered())
                newBlocks[newBlocks.length - 1] = previousBlock.withListAppended(block) as BlockNode;
            else
                newBlocks.push(block);
        });
    
        return this.create(newBlocks);
    
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
        const newText = new TextNode("");

        // If the format is otherwise empty, replace the atom with an empty text node
        const newFormat = previous === undefined && next == undefined ?
            format.withSegmentReplaced(atom, newText) :
            format.withoutSegment(atom);

        // New caret is left, or right, or empty text.
        const newCaret = { node: previous ? previous : next ? next : newText, index: previous ? previous.getLength() : 0 };

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

        // Remember the start and end text index.
        const startTextIndex = this.getTextIndexOfCaret(sortedRange.start);
        const endTextIndex = this.getTextIndexOfCaret(sortedRange.end);

        const blocksToEdit = this.getBlocksInRange(sortedRange);
        if(blocksToEdit === undefined) return;

        // Edit each of the blocks as requested, accounting for the start and stop nodes, creating a new chapter as we go.
        let newBlocksRoot: BlocksNode | undefined = this;
        const newBlocks: BlockNode[] = [];
        for(let i = 0; i < blocksToEdit.length; i++ ) {
            const block = blocksToEdit[i];
            const parent = block.getParent(newBlocksRoot);
            if(parent === undefined) return;

            let newBlock: BlockNode | undefined = block;
            // Edit all of the formats in this block.
            const formats = block.getFormats();
            // We keep track of these so that we can merge formats in lests together after item deletion.
            const editedFormats = [];

            // Loop through and edit all of the formats in the selection.
            for(let j = 0; j < formats.length; j++) {
                const formatToEdit = formats[j];

                // If the selection doesn't contain any part of this format (other formats in the node might be included), skip it.
                const selectedFormatRange = this.getSelectedFormatRange(formatToEdit, sortedRange);
                if(selectedFormatRange !== undefined) {
                    // Format the range and replace it in this chapter! Bail on fail.
                    const editedFormat = formatToEdit.withFormat(selectedFormatRange, format);
                    if(editedFormat === undefined) return;

                    // If this format is a list item and it's empty, then remove the list item.
                    const removeFormat = block instanceof ListNode && editedFormat.isEmptyText();

                    // Create a new chapter tree with the new format, or if the new format is empty, without the paragraph altogether. Bail on fail.
                    newBlock = newBlock.withChildReplaced(formatToEdit, removeFormat ? undefined : editedFormat);
                    if(newBlock === undefined) return;

                    // Ignore the removed formats, we just want to merge the ones that remain.
                    if(!removeFormat)
                        editedFormats.push(editedFormat);
                }
            }

            // If we're deleting and this is a list, merge edited list nodes
            if(format === undefined && newBlock instanceof ListNode && editedFormats.length >= 2) {
                const index = newBlock.getItems().indexOf(editedFormats[editedFormats.length - 1]);
                if(index < 0) return;
                const edit = newBlock.withItemMergedBackwards(index);
                if(edit === undefined) return;
                const [ newList, newCaret ] = edit;
                newBlock = newList;
            }
            
            // If we're deleting, and this block is an empty a paragraph or list that's not the first or last block, remove the block.
            if(format === undefined) {
                if(newBlock instanceof ParagraphNode && i > 0 && i < blocksToEdit.length - 1 && newBlock.getContent().isEmptyText())
                   newBlock = undefined;
                else if(newBlock instanceof ListNode && newBlock.isEmpty())
                    newBlock = undefined;
            }

            // Remember the new block we made.
            if(newBlock !== undefined)
                newBlocks.push(newBlock);

            // Replace the old block with the new block in the tree (or nothing). Bail on fail.
            const updatedRoot = newBlocksRoot.withNodeReplaced(block, newBlock);
            if(updatedRoot === undefined) return;
            newBlocksRoot = updatedRoot;
        }

        // If deleting...
        if(format === undefined) {
            // If there are two distinct non-empty paragraphs we edited, merge them.
            if(newBlocks.length >= 2 && newBlocks) {
                const first = newBlocks[0];
                const last = newBlocks[newBlocks.length - 1];
                if(first instanceof ParagraphNode && last instanceof ParagraphNode) {
                    // Replace the first paragraph with the second merged.
                    newBlocksRoot = newBlocksRoot.withNodeReplaced(first, first.withContent(first.getContent().withSegmentsAppended(last.getContent())));
                    if(newBlocksRoot === undefined) return;
                    // Remove the last paragraph.
                    newBlocksRoot = newBlocksRoot.withNodeReplaced(last, undefined);
                    if(newBlocksRoot === undefined) return;
                }
            }

        }

        // If we ended up with nothing, then create an empty paragraph.
        if(newBlocksRoot.blocks.length === 0) {
            const newParagraph = new ParagraphNode();
            newBlocksRoot = newBlocksRoot.withBlockAppended(newParagraph);
            const newCaret = newParagraph.getFirstCaret();
            if(newCaret === undefined) return;
            return { root: newBlocksRoot, range: { start: newCaret, end: newCaret }}
        }
        
        // Map the text indicies back to carets.
        const startCaret = newBlocksRoot.getTextIndexAsCaret(startTextIndex);
        // If we deleted, then the end caret should be the same as the start.
        const endCaret = format === undefined ? startCaret : newBlocksRoot.getTextIndexAsCaret(endTextIndex);

        if(startCaret === undefined || endCaret === undefined) return;

        // Return the new root and the start and end of the range.
        return { root: newBlocksRoot, range: { start: startCaret, end: endCaret } };

    }

    withSegmentAtSelection(range: CaretRange, nodeCreator: (text: string) => FormatNodeSegmentType): Edit {

        let blocks: BlocksNode = this;
        let caret = range.start;

        // Only works at a text node.
        if(!(caret.node instanceof TextNode)) return;

        // Get the nearest FormatNode parent of the selected text.
        const formatted = caret.node.getClosestParentOfType<FormatNode>(blocks, FormatNode);

        // Can't do anything if it's not in a formatted node.
        if(formatted === undefined) return;
    
        // If there's a selection, grab it's text and then remove the text and update the root and text being edited.
        let selectedText = blocks.getSelectedText(range);
        if (range.start.node !== range.end.node || range.start.index !== range.end.index) {
            // Try to remove the selected text. Bail on fail.
            const edit = blocks.withoutRange(range);
            if(edit === undefined || !(edit.root instanceof BlocksNode)) return;
            // Update the tree we're manipulating.
            blocks = edit.root;
            caret = edit.range.start;
        }

        // Get the nearest FormatNode parent of the revised text.
        const newFormatted = caret.node.getClosestParentOfType<FormatNode>(blocks, FormatNode);
        if(newFormatted === undefined) return;

        // Create and insert the into the formatted node.
        const newNode = nodeCreator.call(undefined, selectedText ? selectedText : "");
        const revisedFormat = newFormatted.withSegmentAt(newNode, caret);
        if(revisedFormat === undefined) return;
        const newCaret = 
            newNode instanceof AtomNode ? newNode.getDefaultCaret() :
            newNode instanceof FormatNode ? newNode.getFirstCaret() :
            newNode instanceof MetadataNode ? { node: newNode.getText(), index: 0 } :
            { node: newNode, index: 0 };

        const newBlocks = blocks.withNodeReplaced(newFormatted, revisedFormat);
        if(newBlocks === undefined) return;

        // Return the edited tree.
        if(newCaret === undefined) return;
        return { root: newBlocks, range: { start: newCaret, end: newCaret } };

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
            const newList = new ListNode(sequence.map(p => p.getContent()), numbered);
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
        return this.withNodeReplaced(list, list.withStyle(numbered))?.withAdjacentListsMerged();
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
                if(parent.getLength() > 1) {
                    const edit = parent.withItemMergedBackwards(index);
                    if(edit === undefined) return;
                    const [ newList, newCaret ] = edit;
                    const newBlocks = this.withNodeReplaced(parent, newList);
                    if(newBlocks === undefined) return;
                    return { root: newBlocks, range: { start: newCaret, end: newCaret } }
                }
                // Delete the list!
                else {
                    if(parent instanceof ListNode) {
                        const newFormat = new FormatNode("", [ new TextNode("")]);
                        const newBlocks = this.withNodeReplaced(parent, newFormat);
                        const newCaret = newFormat.getFirstCaret();
                        if(newBlocks === undefined || newCaret === undefined) return;
                        return { root: newBlocks, range: { start: newCaret, end: newCaret } }
                    }
                    else {
                        const newParagraph = new ParagraphNode();
                        const newBlocks = this.withNodeReplaced(parent, newParagraph);
                        const newCaret = newParagraph.getFirstCaret();
                        if(newBlocks === undefined || newCaret === undefined) return;
                        return { root: newBlocks, range: { start: newCaret, end: newCaret } }
                    }
                }
            }
            // If it's at the beginning of the paragraph, and there's a previous paragraph, merge with the previous paragraph.
            else if(parent instanceof ParagraphNode) {
                const firstCaret = next ? parent.getLastCaret() : parent.getFirstCaret();
                if(firstCaret === undefined) return;
                const adjacentBlock = next ? this.getBlockAfter(parent) : this.getBlockBefore(parent);
                const blocks = parents[parents.length - 1] as BlocksNode;
                // Is this the first/last caret of the paragraph and there's an adjascent block? Try deleting something.
                if(firstCaret.node === caret.node && firstCaret.index === caret.index && adjacentBlock !== undefined) {
                    // If the block adjacent this paragraph is a paragraph, merge the paragraph into the adjascent paragraph.
                    if(adjacentBlock instanceof ParagraphNode) {
                        const newBlocks = this.withNodeReplaced(blocks, blocks.withChildReplaced(adjacentBlock, next ? adjacentBlock.withParagraphPrepended(parent) : adjacentBlock.withParagraphAppended(parent))?.withoutBlock(parent));
                        if(newBlocks === undefined) return;
                        return { root: newBlocks, range: { start: caret, end: caret }}
                    }
                    // If the block adjacent is a list node, merge the paragraph to the list's first/last item.
                    else if(adjacentBlock instanceof ListNode) {
                        // If we're going forwards, put the first list item into the paragraph.
                        if(next) {
                            const format = adjacentBlock.getFirstItem();
                            if(format !== undefined) {
                                const newParagraph = parent.withContent(parent.getContent().withSegmentsAppended(format));
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
                                const newFormat = format.withSegmentAppended(parent.getContent());
                                const newBlocks = blocks.withNodeReplaced(format, newFormat)?.withoutBlock(parent);
                                const newCaret = parent.getContent().getFirstCaret();
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

}