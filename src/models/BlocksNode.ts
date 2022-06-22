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

    getTextOrAtomNodes(): (TextNode | AtomNode<any>)[] {
        return this.getNodes().filter(node => node instanceof TextNode || node instanceof AtomNode) as (TextNode | AtomNode<any>)[]
    }

    getIndexOfTextNode(node: TextNode): number | undefined {
        const text = this.getTextNodes();
        return text.indexOf(node);
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

    // Convert node and index into text index by converting to Bookdown and then finding the index of the node.
    getTextIndexOfCaret(caret: Caret): number {
        const debug = this.toBookdown(caret.node.nodeID);
        const index = debug.indexOf("%debug%");
        return index + caret.index;
    }

    getTextIndexAsCaret(textIndex: number): Caret {
        // Find all of the text nodes in the main document.
        const textNodes = this.getTextNodes();

        // Find all of the text nodes in atom nodes, since those have caret positions too.
        const atomTextNodes = 
            this.getAtomNodes()
                // Only look at atoms with format nodes.
                .filter((atom) => atom.getMeta() instanceof FormatNode)
                // Map to the formats in those
                .map((atom) => atom.getMeta()).
                reduce((previous, current) => previous.concat(current.getTextNodes()), []);

        const allNodes = textNodes.concat(atomTextNodes);

        // Find the first node whose index contains the given text index.
        const match = allNodes.find(node => {
            const debug = this.toBookdown(node.nodeID);
            const index = debug.indexOf("%debug%");
            return textIndex >= index && textIndex <= index + node.getLength();
        });

        // If we found match, return a corresponding caret by converting this whole
        // node to a bookdown string and then finding the index of the match in the string,
        // then subtracting the match from the given text index in the string.
        if(match) {
            const debug = this.toBookdown(match.nodeID);
            const index = debug.indexOf("%debug%");
            return { node: match, index: textIndex - index };
        }

        // Default to last caret, since it's likely to be a missing space at the end.
        const last = textNodes[textNodes.length - 1];
        return { node: last, index: last.getLength() };
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

    withBlockInserted(anchor: BlockNode, block: BlockNode, before: boolean): BlocksNode | undefined {
        const index = this.blocks.indexOf(anchor);
        if(index < 0)
            return;
        const newBlocks = this.blocks.slice();
        newBlocks.splice(index + (before ? 0 : 1), 0, block);
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

        const newBlocks = blocks
            .withBlockInsertedBefore(paragraph, first)
            ?.withBlockInsertedAfter(paragraph, last)
            ?.withoutBlock(paragraph);
        if(newBlocks === undefined) return;

        return { root: newBlocks, range: { start: newCaret, end: newCaret } };

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
            for(let j = 0; j < formats.length; j++) {
                const formatToEdit = formats[j];
                // The start is either the beginning of the paragraph or the start node, if this contains the start node.
                const start = block.contains(sortedRange.start.node) ? sortedRange.start : { node: formatToEdit.getFirstTextNode(), index: 0 };
                // The end is either the end of the paragraph or the end node, if this contains the end node.
                const end = block.contains(sortedRange.end.node) ? sortedRange.end : { node: formatToEdit.getLastTextNode(), index: formatToEdit.getLastTextNode().getLength() };
                // Format the range and replace it in this chapter! Bail on fail.
                const editedFormat = formatToEdit.withFormat({ start: start, end: end }, format);
                if(editedFormat === undefined) return;
                // Create a new chapter tree with the new format, or if the new format is empty, without the paragraph altogether. Bail on fail.
                newBlock = block.withChildReplaced(formatToEdit, editedFormat);
                // Remember the new block we made.
                if(newBlock !== undefined)
                    newBlocks.push(newBlock);
            }

            // If we're deleting, and it's not a paragraph, and there are more than two blocks, and we're deleting, replace the current block with nothing.
            if(format === undefined && i > 0 && i < blocksToEdit.length - 1 && newBlock instanceof ParagraphNode && newBlock.getContent().isEmptyTextNode())
                newBlock = undefined;

            // Replace the old block with the new block in the tree (or nothing). Bail on fail.
            const updatedRoot = newBlocksRoot.withNodeReplaced(block, newBlock);
            if(updatedRoot === undefined) return;
            newBlocksRoot = updatedRoot;
        }

        // If deleting, and there are two distinct non-empty paragraphs we edited, merge them.
        if(format === undefined && newBlocks.length >= 2 && newBlocks) {
            const first = newBlocks[0];
            const last = newBlocks[newBlocks.length - 1];
            if(first instanceof ParagraphNode && last instanceof ParagraphNode) {
                // Replace the first paragraph with the second merged.
                newBlocksRoot = newBlocksRoot.withNodeReplaced(first, first.withContent(first.getContent().withSegmentsAppended(last.getContent())));
                if(newBlocksRoot === undefined) return;
                // Replace the last with an empty paragraph.
                newBlocksRoot = newBlocksRoot.withNodeReplaced(last, last.withContent(new FormatNode(last.getContent().getFormat(), [ new TextNode("")])));
                if(newBlocksRoot === undefined) return;
            }
        }

        // Map the text indicies back to carets.
        const startCaret = newBlocksRoot.getTextIndexAsCaret(startTextIndex);
        // If we deleted, then the end caret should be the same as the start.
        const endCaret = format === undefined ? startCaret : newBlocksRoot.getTextIndexAsCaret(endTextIndex);

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
                // If it failed, let a parent try.
                if(editedFormat !== undefined) {
                    const newBlocks = this.withNodeReplaced(parent, editedFormat.root);
                    if(newBlocks === undefined) return;
                    return { root: newBlocks, range: editedFormat.range }
                }
            }
            // If it's at the beginning of the paragraph, and there's a previous paragraph, merge with the previous paragraph.
            else if(parent instanceof ParagraphNode) {
                const firstCaret = next ? parent.getLastCaret() : parent.getFirstCaret();
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
                                if(newBlocks === undefined) return;
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