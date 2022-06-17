import { Bookkeeping } from "./Parser";
import { BlockNode } from "./BlockNode";
import { ErrorNode } from "./ErrorNode";
import { TextNode } from "./TextNode";
import { FootnoteNode } from "./FootnoteNode";
import { EmbedNode } from "./EmbedNode";
import { Node } from "./Node";
import { ParagraphNode } from "./ParagraphNode";
import { Format, FormatNode, FormatNodeSegmentType } from "./FormatNode";
import { MetadataNode } from "./MetadataNode";
import { AtomNode } from "./AtomNode";
import { CitationsNode } from "./CitationsNode";
import { LabelNode } from "./LabelNode";
import { CommentNode } from "./CommentNode";
import { BlocksNode } from "./BlocksNode";
import { Caret, CaretRange, TextRange } from "./Caret";
import { Edit } from "../views/editor/Commands";

export class ChapterNode extends BlocksNode {

    #metadata: Bookkeeping;

    constructor(blocks: BlockNode[], metadata: Bookkeeping) {
        super(blocks);

        // Content extracted during parsing.
        this.#metadata = metadata;

    }

    getType() { return "chapter"; }
    getFormats(): FormatNode[] { return []; }
 
    getChapter() { return this; }

    create(blocks: BlockNode[]): BlocksNode {
        return new ChapterNode(blocks, this.#metadata);
    }

    getNode(id: number) { return this.getNodes().filter(n => n.getID() === id); }

    getErrors(): ErrorNode[] { return this.getNodes().filter(n => n instanceof ErrorNode) as ErrorNode[]; }
    getCitations(): Set<string> { 
        const citations = new Set<string>();
        (this.getNodes().filter(n => n instanceof CitationsNode) as CitationsNode[]).forEach(cites => cites.getMeta().forEach(citationID => citations.add(citationID)));
        return citations;
    }
    getFootnotes(): FootnoteNode[] { return this.getNodes().filter(n => n instanceof FootnoteNode) as FootnoteNode[]; }
    getHeaders(): ParagraphNode[] { return this.getNodes().filter(n => n instanceof ParagraphNode && n.getLevel() > 0) as ParagraphNode[]; }
    getEmbeds(): EmbedNode[] { return this.getNodes().filter(n => n instanceof EmbedNode) as EmbedNode[]; }
    getComments(): CommentNode[] { return this.getNodes().filter(n => n instanceof CommentNode) as CommentNode[]; }

    getLabels(): LabelNode[] {
        return (this.getNodes().filter(n => n instanceof LabelNode) as LabelNode[]);
    }

    hasLabel(labelID: string) {
        return this.getLabels().find(label => label.getMeta() === labelID) !== undefined;
    }

    getCitationNumber(citationID: string) {
        const index = Array.from(this.getCitations()).sort().indexOf(citationID);
        return index < 0 ? null : index + 1;
    }

    toText(): string {
        return this.blocks.map(block => block.toText()).join(" ");
    }

    toBookdown(debug?: number): string {
        // Render the symbols then all the blocks
        return Object.keys(this.#metadata.symbols).sort().map(name => `@${name}: ${this.#metadata.symbols[name]}\n\n`).join("") +
            this.blocks.map(b => b.toBookdown(debug)).join("\n\n");
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

    // Convert text index to node by iterating through text nodes and finding the corresponding node.
    textRangeToCaret(range: TextRange): CaretRange {
        return { start: this.textIndexToCaret(range.start), end: this.textIndexToCaret(range.end) }; 
    }

    caretRangeToTextRange(range: CaretRange): TextRange {
        return { start: this.caretToTextIndex(range.start), end: this.caretToTextIndex(range.end) };
    }

    getNextTextOrAtom(node: TextNode | AtomNode<any>): TextNode | AtomNode<any> | undefined {
        // Otherwise, find the next text node after this one.
        const nodes = this.getTextOrAtomNodes();
        const index = nodes.indexOf(node);
        return index === undefined ? undefined :
            index < nodes.length - 1 ? nodes[index + 1] :
            undefined;
    }

    getPreviousTextOrAtom(node: TextNode | AtomNode<any>): TextNode | AtomNode<any> | undefined {
        // Otherwise, find the next text node after this one.
        const nodes = this.getTextOrAtomNodes();
        const index = nodes.indexOf(node);
        return index === undefined ? undefined :
            index > 0 ? nodes[index - 1] :
            undefined;
    }

    traverseChildren(fn: (node: Node) => void): void {
        this.blocks.forEach(item => item.traverse(fn));
    }

    withChildReplaced(node: Node, replacement: Node | undefined) {

        if(!(node instanceof BlockNode) || !(replacement instanceof BlockNode)) return;
        const index = this.blocks.indexOf(node);

        /// If we couldn't find the requested node, don't change anything.
        if(index < 0)
            return undefined;

        // Make a new callout, assigning and re-parenting the replacement.
        const blocks = replacement === undefined ?
            [ ...this.blocks.slice(0, index), ...this.blocks.slice(index + 1)] :
            [ ...this.blocks.slice(0, index), replacement, ...this.blocks.slice(index + 1) ];

        return new ChapterNode(blocks, this.#metadata);

    }

    copy(): ChapterNode {
        return new ChapterNode(this.blocks.map(b => b.copy()), this.#metadata);
    }

    insertSelection(char: string, range: CaretRange): Edit {

        if(!(range.start.node instanceof TextNode))
            return;

        // Insert at the start.
        let insertionPoint = range.start;

        // If there's a selection, remove it before inserting, and insert at the caret returned.
        if (range.start.node !== range.end.node || range.start.index !== range.end.index) {
            // Try to remove the range.
            let edit = this.removeRange(range);
            // If we fail, fail to insert at the selection.
            if(edit === undefined)
                return;
            insertionPoint = edit.range.start;
        }

        // Insert at the start position.
        if(insertionPoint.node instanceof TextNode)
            return insertionPoint.node.withCharacterInserted(this, char, insertionPoint.index);

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

    insertNodeAtSelection(range: CaretRange, nodeCreator: (text: string) => FormatNodeSegmentType): Edit | undefined {

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
            const edit = this.removeRange(range);
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
        if(newRoot === undefined) return undefined;

        // Return the edited tree.
        return { root: newRoot, range: { start: newCaret, end: newCaret } };

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

    splitSelection(range: CaretRange): Edit {

        let caret = range.start;

        // If there's a selection, remove it before inserting.
        if (range.start.node !== range.end.node || range.start.index !== range.end.index) {
            const edit = this.removeRange(range);
            if(edit === undefined) return;
            caret = edit.range.start;
        }
    
        // Find what paragraph the caret is in.
        // There are some contexts with no paragraphs. Return the start range given.
        const paragraph = caret.node.closestParent<ParagraphNode>(this, ParagraphNode);        
        if(paragraph === undefined) return;

        // Find the block the paragraph is in.
        const blocks = paragraph.closestParent<BlocksNode>(this, BlocksNode);
        if(blocks === undefined) return;

        // Split the paragraph in two.
        const split = paragraph.split(caret);
        if(split === undefined) return;
        const [ first, last, newCaret ] = split;

        const newBlocks = blocks
            .withBlockInsertedBefore(paragraph, last)
            ?.withBlockInsertedBefore(last, first)
            ?.withoutBlock(paragraph);
        if(newBlocks === undefined) return;

        const newRoot = newBlocks.rootWithChildReplaced(this, blocks, newBlocks);
        if(newRoot === undefined) return;

        return { root: newRoot, range: { start: newCaret, end: newCaret }};

    }

    removeRedundantChildren(nodes: Set<Node>) {

        // Remove any nodes whose parents are also in the list, as they would be redundant to format.
        const redundant: Set<Node> = new Set<Node>()
        nodes.forEach(node1 => {
            nodes.forEach(node2 => {
                if(node1 !== node2 && node1.hasAncestor(this, node2))
                nodes.add(node1)
            })
        })

        // Remove any redundant nodes from the deletion list.
        redundant.forEach(node => nodes.delete(node));
        
    }

    removeRange(range: CaretRange): Edit {
        return this.editRange(range, undefined);
    }

    removeAtom(atom: AtomNode<any>): Edit {

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
        if(newRoot === undefined) return;

        // Return the edited tree!
        return { root: newRoot, range: { start: newCaret, end: newCaret }};

    }

    editRange(range: CaretRange, format: Format | undefined): Edit {

        // Only works on text nodes, atom nodes, and metadata nodes.
        if( !(range.start.node instanceof TextNode || range.start.node instanceof AtomNode) || 
            !(range.end.node instanceof TextNode || range.end.node instanceof AtomNode))
            return;
    
        // Have we selected a single atom node for removal? Remove it and place the caret in the adjacent word.
        if(format === undefined && (range.start.node instanceof AtomNode && range.end.node instanceof AtomNode && range.start.node === range.end.node))
            return this.removeAtom(range.start.node);

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
        let newRoot: ChapterNode | undefined = this;
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
            newRoot = block.replace(newRoot, newBlock) as ChapterNode;
            if(newRoot == undefined) return;

        }

        // If deleting, and there are two distinct non-empty paragraphs we edited, merge them.
        if(format === undefined && newBlocks.length > 2) {
            const first = newBlocks[0];
            const last = newBlocks[newBlocks.length - 1];
            if(first instanceof ParagraphNode && last instanceof ParagraphNode) {
                // Replace the first paragraph with the second merged.
                newRoot = first.replace(newRoot, first.withContent(first.getContent().withSegmentsAppended(last.getContent()))) as ChapterNode;
                if(newRoot === undefined) return;
                // Replace the last with an empty paragraph.
                newRoot = last.replace(newRoot, last.withContent(new FormatNode(last.getContent().getFormat(), [ new TextNode("")]))) as ChapterNode;
                if(newRoot === undefined) return;
            }
        }

        // Map the text indicies back to carets.
        const startCaret = this.textIndexToCaret(startTextIndex);
        const endCaret = format === undefined ? startCaret : this.textIndexToCaret(startEndIndex);

        // Return the new root and the start and end of the range.
        return { root: newRoot, range: { start: startCaret, end: endCaret } };

    }

}