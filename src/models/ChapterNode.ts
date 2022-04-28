import { Bookkeeping } from "./Parser";
import { BlockNode } from "./BlockNode";
import { BlockParentNode } from "./BlockParentNode";
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
import { Caret, CaretRange } from "./Caret";

export class ChapterNode extends BlocksNode {

    #blocks: BlockNode[];
    #metadata: Bookkeeping;
    index: Map<number, Node>;
    nextID: number;

    constructor(blocks: BlockNode[], metadata: Bookkeeping) {
        super(undefined, blocks, "chapter");

        // The AST of the chapter.
        this.#blocks = blocks;

        // Content extracted during parsing.
        this.#metadata = metadata;

        // Start the node index empty
        this.index = new Map();

        // Start next ID at 0
        this.nextID = 0;

        // Set the ID since super can't
        this.indexNode(this)

    }

    getChapter() {
        return this;
    }

    getBlocks() { return this.#blocks; }

    indexNode(node: Node) {
        this.index.set(this.nextID, node);
        node.setID(this.nextID);
        this.nextID++;

    }

    unindexNode(node: Node) {
        if(node.nodeID)
            this.index.delete(node.nodeID)
    }

    getNode(id: number) { return this.index.get(id); }

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
        return this.#blocks.map(block => block.toText()).join(" ");
    }

    toBookdown() {
        // Render the symbols then all the blocks
        return Object.keys(this.#metadata.symbols).sort().map(name => `@${name}: ${this.#metadata.symbols[name]}\n\n`).join("") +
            this.#blocks.map(b => b.toBookdown()).join("\n\n");
    }

    getTextNodes(): TextNode[] {
        return this.getNodes().filter(node => node instanceof TextNode) as TextNode[]
    }

    getTextOrAtomNodes(): (TextNode | AtomNode<any>)[] {
        return this.getNodes().filter(node => node instanceof TextNode || node instanceof AtomNode) as (TextNode | AtomNode<any>)[]
    }

    getIndexOfTextNode(node: TextNode): number | undefined {
        const text = this.getTextNodes();
        return text.indexOf(node);
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
        this.#blocks.forEach(item => item.traverse(fn) )
    }

    removeChild(node: Node): void {
        this.#blocks = this.#blocks.filter(item => item !== node);
    }

    replaceChild(node: Node, replacement: BlockNode): void {
        const index = this.#blocks.indexOf(node as BlockNode);
        if(index < 0) return;
        this.#blocks[index] = replacement;
    }

    copy(parent: Node): ChapterNode {
        const blocks: BlockNode[] = []
        const chap = new ChapterNode(blocks, this.#metadata)
        this.#blocks.forEach(b => blocks.push(b.copy(chap) as BlockNode))
        return chap
    }

    clean() {
        // Clean all the nodes.
        this.getNodes().forEach(n => n !== this ? n.clean() : undefined);
    }

    getSiblingOf(child: Node, next: boolean) {
        return this.#blocks[this.#blocks.indexOf(child as BlockNode) + (next ? 1 : -1)];
    }

    insertSelection(char: string, range: CaretRange): Caret {

        if(range.start.node instanceof TextNode) {        
 
            let caret = range.start;

            // If there's a selection, remove it before inserting.
            if (range.start.node !== range.end.node || range.start.index !== range.end.index)
                caret = this.removeRange(range);

            // Insert at the start position.
            if(caret.node instanceof TextNode)
                return caret.node.insert(char, caret.index);
            else
                return caret;

        } else
            return range.start;

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

    insertNodeAtSelection(range: CaretRange, nodeCreator: (parent: FormatNode, text: string) => FormatNodeSegmentType): Caret {

        let caret = range.start;

        // Only works at a text node.
        if(!(caret.node instanceof TextNode))
            return caret;

        // Get the nearest FormatNode parent of the selected text.
        const formatted = caret.node.getClosestParentMatching(p => p instanceof FormatNode) as FormatNode;

        // Can't do anything if it's not in a formatted node.
        if(formatted === undefined)
            return caret;
    
        // If there's a selection, grab it's text and then remove the text.
        let selectedText = this.getSelectedText(range);
        if (range.start.node !== range.end.node || range.start.index !== range.end.index)
            caret = this.removeRange(range);

        // Create and insert the into the formatted node.
        return formatted.insertSegmentAt(nodeCreator.call(undefined, formatted, selectedText ? selectedText : ""), caret);

    }

    deleteSelection(range: CaretRange, backward: boolean): Caret {
    
        const start = range.start;

        // If the start and end are the same, delete within the node.
        if(start.node === range.end.node) {
            if(start.node instanceof TextNode) {
                // If the positions are the same, just do a single character.
                // Otherwise, do a range.
                return range.start.index === range.end.index ? 
                    ( backward ? start.node.deleteBackward(start.index) : start.node.deleteForward(start.index)) :
                    start.node.deleteRange(start.index, range.end.index);
            }
            else if(start.node instanceof AtomNode) {
                return start.node.deleteBackward();
            }
            // Otherwise, do nothing.
            else return range.start;
        }
        // If the start and end positions are different, delete everything between them, and the corresponding parts of each.
        else return this.removeRange(range);

    }

    // Swap them order if this is two text nodes that are reversed.
    sortRange(range: CaretRange): CaretRange {

        if(!(range.start.node instanceof TextNode) || !(range.end.node instanceof TextNode))
            return range;

        // Where do these text nodes appear in the chapter?
        let startIndex = this.getIndexOfTextNode(range.start.node);
        let endIndex = this.getIndexOfTextNode(range.end.node);

        // Defensively verify that we could find the given nodes in the document.
        // If we can't, something is wrong upstream.
        if(startIndex && startIndex < 0)
            throw Error(`Could not find ${range.start.node.toBookdown()} in chapter.`);
        if(endIndex && endIndex < 0)
            throw Error(`Could not find ${range.end.node.toBookdown()} in chapter.`);

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

    caretToTextIndex(caret: Caret): number {

        if(!(caret.node instanceof TextNode))
            throw Error("Can only get text position of text nodes");

        const text = this.getTextNodes();
        let index = 0;
        for(let i = 0; i < text.length; i++) {
            const t = text[i];
            if(t !== caret.node)
                index += t.getLength();
            else {
                index += caret.index;
                break;
            }
        }

        return index;

    }

    textIndexToCaret(index: number): Caret | undefined {

        const text = this.getTextNodes();
        let currentIndex = 0;
        for(let i = 0; i < text.length; i++) {
            const t = text[i];
            if(index >= currentIndex && index <= currentIndex + t.getLength())
                return { node: t, index: index - currentIndex };
            currentIndex += t.getLength();
        }
        return undefined;

    }

    removeRange(range: CaretRange) : Caret {

        // Sort the range
        const sortedRange = this.sortRange(range);

        // Find all text nodes between the range.
        const { start, end } = sortedRange;
        
        // Can only delete between text nodes.
        if(!(start.node instanceof TextNode) || !(end.node instanceof TextNode))
            return range.start;

        // No op if the positions are the same.
        if(start.node === end.node && start.index === end.index)
            return range.start;

        // Just keep backspacing from the end caret until the returned caret is identical to the previous caret or the start caret.
        let previousCaret = undefined;
        let startPosition = this.caretToTextIndex(start);
        let currentCaret = end;
        let currentPosition = this.caretToTextIndex(end);
        do {
            previousCaret = currentCaret;
            currentCaret = (currentCaret.node as TextNode).deleteBackward(currentCaret.index);
            currentPosition = this.caretToTextIndex(currentCaret);
        } while(currentPosition > startPosition &&
                !(previousCaret.node === currentCaret.node && previousCaret.index === currentCaret.index));

        return currentCaret;

    }

    splitSelection(range: CaretRange): Caret {

        let caret = range.start;

        // If there's a selection, remove it before inserting.
        if (range.start.node !== range.end.node || range.start.index !== range.end.index)
            caret = this.removeRange(range);
    
        // Find what paragraph it's in.
        let paragraph = caret.node.closestParent<ParagraphNode>(ParagraphNode);
        
        // There are some contexts with no paragraphs. Return the start range given.
        if(paragraph === undefined) return range.start;

        return paragraph.split(caret);

    }

    insertAfter(anchor: BlockNode, block: BlockNode) {
        const index = this.#blocks.indexOf(anchor);
        if(index < 0)
            return;
        this.#blocks.splice(index + 1, 0, block);
    }

    removeRedundantChildren(nodes: Set<Node>) {

        // Remove any nodes whose parents are also in the list, as they would be redundant to format.
        const redundant: Set<Node> = new Set<Node>()
        nodes.forEach(node1 => {
            nodes.forEach(node2 => {
                if(node1 !== node2 && node1.hasParent(node2))
                nodes.add(node1)
            })
        })

        // Remove any redundant nodes from the deletion list.
        redundant.forEach(node => nodes.delete(node));
        
    }

    formatSelection(range: CaretRange, format: Format): CaretRange {

        // Only works on text nodes.
        if(!(range.start.node instanceof TextNode) || !(range.end.node instanceof TextNode))
            return range;

        // Preserve the original range, since there are a few cases where we adjust it.
        let adjustedRange = range;

        // If this a single point in format, and we're clearing formatting, just select the whole format.
        if(format === "" && range.start.node === range.end.node && range.start.index === range.end.index) {
            const selection = range.start.node.getFormatRoot()?.getSelection();
            if(selection)
                adjustedRange = selection;
        }

        // Sort the range if it's out of order
        const sortedRange = this.sortRange(adjustedRange);

        // Find all of the format roots in the selection by finding the range's common ancestor,
        // then finding all of the format roots between the start and end node, inclusive.
        const commonAncestor = sortedRange.start.node.getCommonAncestor(sortedRange.end.node);
        if(commonAncestor === undefined)
            return range;
        const formats = new Set<FormatNode>();
        let insideSelection = false;
        commonAncestor.getNodes().forEach(node => {
            if(node === sortedRange.start.node)
                insideSelection = true;
            const root = node instanceof TextNode ? node.getFormatRoot() : undefined;
            if(insideSelection && root)
                formats.add(root);
            if(insideSelection && node === sortedRange.end.node)
                insideSelection = false;
        });

        // Format each of the format roots as requested, accounting for the start and stop nodes.
        const newRanges: CaretRange[] = [];
        formats.forEach(root => {

            // The start is either the beginning of the format root or the start node, if this contains the start node.
            const start = (sortedRange.start.node as TextNode).getFormatRoot() === root ? sortedRange.start : { node: root.getFirstTextNode(), index: 0 };
            // The end is either the end of the formatting root or the end node, if this contains the end node.
            const end = (sortedRange.end.node as TextNode).getFormatRoot() === root ? sortedRange.end : { node: root.getLastTextNode(), index: root.getLastTextNode().getLength() };
            // Format the range and save the revised range!
            newRanges.push(root.formatRange({ start: start, end: end }, format));

        });

        // Return the new range.
        return { start: newRanges[0].start, end: newRanges[newRanges.length - 1].end };

    }

    // If the caret is in an atom of the given type, remove it.
    // If it is not, wrap it.
    toggleAtom<AtomType extends MetadataNode<any>>(range: CaretRange, type: Function, creator: (parent: FormatNode, text: string) => FormatNodeSegmentType): Caret | undefined {

        // If the caret is already in a link node, remove it.
        if(range.start.node.inside(type)) {
            const atom = range.start.node.getClosestParentMatching(p => p instanceof type) as AtomType;
            const formatted = atom.getParent();
            if(formatted) {
                const index = formatted.caretToTextIndex(range.start);
                atom.unwrap();
                const newCaret = formatted.textIndexToCaret(index);
                if(newCaret)
                    return newCaret;
            }
        }
        else {
            const caret = this.insertNodeAtSelection(range, creator);
            // Get the text node inside the new link.
            const textNode = (caret.node as MetadataNode<any>).getText();
            return { node: textNode, index: textNode.getLength() }
        }

        return undefined;

    }

}