import { Node } from "./Node";
import { BlockNode } from "./BlockNode";
import { ListNode } from "./ListNode";
import { Caret, CaretRange } from "./Caret";
import { ParagraphNode } from "./ParagraphNode";
import { Format, FormatNode, FormatNodeSegmentType } from "./FormatNode";
import { TextNode } from "./TextNode";
import { AtomNode } from "./AtomNode";
import { MetadataNode } from "./MetadataNode";

export abstract class BlocksNode extends BlockNode {
    
    readonly blocks: BlockNode[];

    constructor(elements: BlockNode[]) {
        super();
        this.blocks = elements;
    }

    getBlocks() { return this.blocks; }

    indexOf(block: BlockNode): number | undefined {
        const index = this.blocks.indexOf(block);
        return index < 0 ? undefined : index;
    }

    contains(block: BlockNode) { return this.indexOf(block) !== undefined; }

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

        const firstIndex = this.indexOf(first);
        const lastIndex = this.indexOf(last);
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
    caretToTextIndex(caret: Caret): number {
        const debug = this.toBookdown(caret.node.nodeID);
        const index = debug.indexOf("%debug%");
        return index + caret.index;
    }

    textIndexToCaret(textIndex: number): Caret {
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

        // If we found match, return a corresponding caret.
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
    sortRange(range: CaretRange): CaretRange {

        const start = range.start.node;
        const end = range.end.node;

        // Find the common ancestor of the two nodes.
        const ancestor = start.getCommonAncestor(this, end);

        if(ancestor === undefined)
            return range;

        // Where do these text nodes appear in the ancestor's node sequence?
        let startIndex = ancestor.getIndexOf(start);
        let endIndex = ancestor.getIndexOf(end);

        // Defensively verify that we could find the given nodes in the document.
        // If we can't, something is wrong upstream.
        if(startIndex === undefined)
            throw Error(`Could not find in common ancestor.`);
        if(endIndex === undefined)
            throw Error(`Could not find in common ancestor.`);

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
    
    withBlockInserted(anchor: BlockNode, block: BlockNode, before: boolean): BlocksNode | undefined {
        const index = this.blocks.indexOf(anchor);
        if(index < 0)
            return;
        const newBlocks = this.blocks.slice(0).splice(index + (before ? 0 : 1), 0, block);
        return this.create(newBlocks);
    }

    withoutBlock(block: BlockNode): BlocksNode {
        return this.create(this.blocks.filter(n => n === block));
    }

    withBlockInsertedBefore(anchor: BlockNode, block: BlockNode) {
        return this.withBlockInserted(anchor, block, true);
    }

    withBlockInsertedAfter(anchor: BlockNode, block: BlockNode) {
        return this.withBlockInserted(anchor, block, false);
    }

    withMergedAdjacentLists(): BlocksNode {

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

    withSelectionSplit(range: CaretRange): [ BlocksNode, Caret ] | undefined {

        let caret = range.start;
        let blocks: BlocksNode = this;

        // If there's a selection, remove it before inserting.
        if (range.start.node !== range.end.node || range.start.index !== range.end.index) {
            const edit = this.withoutRange(range);
            if(edit === undefined) return;
            blocks = edit.root;
            caret = edit.range.start;
        }
    
        // Find what paragraph the caret is in.
        // There are some contexts with no paragraphs. Return the start range given.
        const paragraph = caret.node.closestParent<ParagraphNode>(this, ParagraphNode);        
        if(paragraph === undefined) return;

        // Split the paragraph in two.
        const split = paragraph.split(caret);
        if(split === undefined) return;
        const [ first, last ] = split;
        const newCaret = last.getFirstCaret();

        const newBlocks = this
            .withBlockInsertedBefore(paragraph, last)
            ?.withBlockInsertedBefore(last, first)
            ?.withoutBlock(paragraph);
        if(newBlocks === undefined) return;

        return [ newBlocks, newCaret ];

    }

    withoutRange(range: CaretRange): { root: BlocksNode, range: CaretRange } | undefined {
        return this.withRangeFormatted(range, undefined);
    }

    withoutAtom(atom: AtomNode<any>): { root: BlocksNode, range: CaretRange } | undefined {

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
        const newRoot = format.replace(this, newFormat);
        if(newRoot === undefined || !(newRoot instanceof BlocksNode)) return;

        // Return the edited tree!
        return { root: newRoot, range: { start: newCaret, end: newCaret } };

    }

    withRangeFormatted(range: CaretRange, format: Format | undefined): { root: BlocksNode, range: CaretRange } | undefined {

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

        // Remember the start and end text index.
        const startTextIndex = this.caretToTextIndex(range.start);
        const startEndIndex = this.caretToTextIndex(range.end);

        // Sort the range if it's out of order, since the algorithm below assumes that it's ordered.
        const sortedRange = this.sortRange(adjustedRange);

        // Find all of the block nodes between the start and end node, inclusive, in order, by looping
        // through the nodes in the ancestor and identifying blocks. If there's no common ancestor, fail.
        const commonAncestor = sortedRange.start.node.getCommonAncestor(this, sortedRange.end.node);
        if(commonAncestor === undefined) return;

        // Find all of the formatting roots included in the selection as well as any non-paragraph blocks so we can edit them.
        // Start tracking when we hit the start node. Stop tracking when we hit the end node.
        const blocksToEdit: BlockNode[] = [];
        let insideSelection = false;
        commonAncestor.getNodes().forEach(node => {
            if(node === sortedRange.start.node) insideSelection = true;
            if(insideSelection && node instanceof BlockNode) blocksToEdit.push(node);
            if(insideSelection && node === sortedRange.end.node) insideSelection = false;
        });

        // Edit each of the blocks as requested, accounting for the start and stop nodes, creating a new chapter as we go.
        let newRoot: BlocksNode | undefined = this;
        const newBlocks: BlockNode[] = [];
        for(let i = 0; i < blocksToEdit.length; i++ ) {
            const block = blocksToEdit[i];
            const parent = block.getParent(newRoot);
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
            const updatedRoot = block.replace(newRoot, newBlock);
            if(newRoot === undefined || !(newRoot instanceof BlocksNode)) return;
            newRoot = updatedRoot as BlocksNode;

        }

        // If deleting, and there are two distinct non-empty paragraphs we edited, merge them.
        if(format === undefined && newBlocks.length > 2) {
            const first = newBlocks[0];
            const last = newBlocks[newBlocks.length - 1];
            if(first instanceof ParagraphNode && last instanceof ParagraphNode) {
                // Replace the first paragraph with the second merged.
                newRoot = first.replace(newRoot, first.withContent(first.getContent().withSegmentsAppended(last.getContent()))) as BlocksNode;
                if(newRoot === undefined) return;
                // Replace the last with an empty paragraph.
                newRoot = last.replace(newRoot, last.withContent(new FormatNode(last.getContent().getFormat(), [ new TextNode("")]))) as BlocksNode;
                if(newRoot === undefined) return;
            }
        }

        // Map the text indicies back to carets.
        const startCaret = this.textIndexToCaret(startTextIndex);
        const endCaret = format === undefined ? startCaret : this.textIndexToCaret(startEndIndex);

        // Return the new root and the start and end of the range.
        return { root: newRoot, range: { start: startCaret, end: endCaret } };

    }

    withSegmentAtSelection(range: CaretRange, nodeCreator: (text: string) => FormatNodeSegmentType): { root: BlocksNode, range: CaretRange } | undefined {

        let root: Node = this;
        let caret = range.start;

        // Only works at a text node.
        if(!(caret.node instanceof TextNode)) return;

        // Get the nearest FormatNode parent of the selected text.
        const formatted = caret.node.closestParent<FormatNode>(this, FormatNode);

        // Can't do anything if it's not in a formatted node.
        if(formatted === undefined) return;
    
        // If there's a selection, grab it's text and then remove the text and update the root and text being edited.
        let selectedText = this.getSelectedText(range);
        if (range.start.node !== range.end.node || range.start.index !== range.end.index) {
            const edit = this.withoutRange(range);
            // Uh oh, fail.
            if(edit === undefined) return;
            root = edit.root;
            caret = edit.range.start;
        }

        // Get the nearest FormatNode parent of the revised text.
        const newFormatted = caret.node.closestParent<FormatNode>(this, FormatNode);
        if(newFormatted === undefined) return;

        // Create and insert the into the formatted node.
        const newNode = nodeCreator.call(undefined, selectedText ? selectedText : "");
        const revisedFormat = newFormatted.withSegmentAt(newNode, caret);
        if(revisedFormat === undefined) return;
        const newCaret = 
            newNode instanceof AtomNode ? newNode.getDefaultCaret() :
            newNode instanceof FormatNode ? newNode.getFirstCaret() :
            newNode instanceof MetadataNode ? newNode.getMeta().getFirstCaret() :
            { node: newNode, index: 0 };

        const newFormattedParent = root.getParentOf(newFormatted);
        if(newFormattedParent === undefined) return;
        const newRoot = newFormattedParent.rootWithChildReplaced(root, newFormatted, revisedFormat);
        if(newRoot === undefined || !(newRoot instanceof BlocksNode)) return undefined;

        // Return the edited tree.
        return { root: newRoot, range: { start: newCaret, end: newCaret } };

    }

    abstract create(blocks: BlockNode[]): BlocksNode;

}