import { Bookkeeping, BlockNode, BlockParentNode } from "./Parser";
import { ErrorNode } from "./ErrorNode";
import { TextNode } from "./TextNode";
import { FootnoteNode } from "./FootnoteNode";
import { HeaderNode } from "./HeaderNode";
import { EmbedNode } from "./EmbedNode";
import { Node } from "./Node";
import { ParagraphNode } from "./ParagraphNode";
import { Format, FormattedNode } from "./FormattedNode";
import { RuleNode } from "./RuleNode";

export type Caret = { node: Node, index: number }
export type CaretRange = { start: Caret, end: Caret }

export class ChapterNode extends Node {
    blocks: BlockNode[];
    metadata: Bookkeeping;
    index: Map<number, Node>;
    nextID: number;

    constructor(blocks: BlockNode[], metadata: Bookkeeping) {
        super(undefined, "chapter");

        // The AST of the chapter.
        this.blocks = blocks;

        // Content extracted during parsing.
        this.metadata = metadata;

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

    getErrors(): ErrorNode[] { return this.metadata.errors; }
    getCitations(): Record<string, boolean> { return this.metadata.citations; }
    getFootnotes(): FootnoteNode[] { return this.metadata.footnotes; }
    getHeaders(): HeaderNode[] { return this.metadata.headers; }
    getEmbeds(): EmbedNode[] { return this.metadata.embeds; }

    getCitationNumber(citationID: string) {

        const index = Object.keys(this.getCitations()).sort().indexOf(citationID);

        if (index < 0)
            return null;

        else
            return index + 1;

    }

    toText(): string {
        return this.blocks.map(block => block.toText()).join(" ");
    }

    toBookdown() {
        // Render the symbols then all the blocks
        return Object.keys(this.metadata.symbols).sort().map(name => `@${name}: ${this.metadata.symbols[name]}\n\n`).join("") +
            this.blocks.map(b => b.toBookdown()).join("\n\n");
    }

    getTextNodes(): TextNode[] {
        return this.getNodes().filter(node => node instanceof TextNode) as TextNode[]
    }

    getIndexOfTextNode(node: TextNode): number | undefined {
        const text = this.getTextNodes();
        return text.indexOf(node);
    }

    getNextTextNode(node: TextNode): TextNode | undefined {
        // Otherwise, find the next text node after this one.
        const text = this.getTextNodes();
        const index = text.indexOf(node);
        return index === undefined ? undefined :
            index < text.length - 1 ? text[index + 1] :
            undefined;
    }

    getPreviousTextNode(node: TextNode): TextNode | undefined {
        // Otherwise, find the next text node after this one.
        const text = this.getTextNodes();
        const index = text.indexOf(node);
        return index === undefined ? undefined :
            index > 0 ? text[index - 1] :
            undefined;
    }

    traverseChildren(fn: (node: Node) => void): void {
        this.blocks.forEach(item => item.traverse(fn) )
    }

    removeChild(node: Node): void {
        this.blocks = this.blocks.filter(item => item !== node)
    }

    replaceChild(node: Node, replacement: BlockNode): void {
        const index = this.blocks.indexOf(node as BlockNode);
        if(index < 0) return;
        this.blocks[index] = replacement;
    }

    copy(parent: Node): ChapterNode {
        const blocks: BlockNode[] = []
        const chap = new ChapterNode(blocks, this.metadata)
        this.blocks.forEach(b => blocks.push(b.copy(chap) as BlockNode))
        return chap
    }

    clean() {
        // Clean all the nodes.
        this.getNodes().forEach(n => n !== this ? n.clean() : undefined);
    }

    getSiblingOf(child: Node, next: boolean) {
        return this.blocks[this.blocks.indexOf(child as BlockNode) + (next ? 1 : -1)];
    }

    insertSelection(char: string, range: CaretRange): Caret {

        if(range.start.node instanceof TextNode) {        
 
            let caret = range.start;

            // If there's a selection, remove it before inserting.
            if (range.start.node !== range.end.node || range.start.index !== range.end.index)
                caret = this.removeRange(range);

            // Insert at the start position.
            return range.start.node.insert(char, range.start.index);

        } else
            return range.start;

    }

    deleteSelection(range: CaretRange, backward: boolean): Caret {
    
        const start = range.start;

        // If the start and end are the same, delete within the node.
        if(start.node === range.end.node && start.node instanceof TextNode) {

            // If the positions are the same, just do a single character.
            // Otherwise, do a range.
            return range.start.index === range.end.index ? 
                ( backward ? start.node.deleteBackward(start.index) : start.node.deleteForward(start.index)) :
                start.node.deleteRange(start.index, range.end.index);

        }
        // If the start and end positions are different, delete everything between them, and the corresponding parts of each.
        else return this.removeRange(range)

    }

    // Swap them order if this is two text nodes that are reversed.
    sortRange(range: CaretRange): CaretRange {

        if(!(range.start.node instanceof TextNode) || !(range.end.node instanceof TextNode))
            return range;

        // If they're different text nodes, just delete all of the text in between.
        let startIndex = this.getIndexOfTextNode(range.start.node);
        let endIndex = this.getIndexOfTextNode(range.end.node);

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

    removeRange(range: CaretRange) : Caret {

        // Find all text nodes between the range.
        const { start, end } = range;

        // If the start and end positions are different, delete everything between them, and the corresponding parts of each.
        if(!(start.node instanceof TextNode) || !(end.node instanceof TextNode))
            return range.start;

        // Just ask the text node to delete the range.
        if(start.node === end.node)
            return start.node.deleteRange(start.index, end.index);

        // Sort the range
        const sortedRange = this.sortRange(range);

        // If they're different text nodes, just delete all of the text in between.
        let startIndex = this.getIndexOfTextNode(start.node);
        let endIndex = this.getIndexOfTextNode(end.node);

        // Just in case...
        if(startIndex === undefined || endIndex === undefined)
            return range.start;

        // Delete everything between
        const text = this.getTextNodes();

        // Delete all of the text
        for(let index = startIndex + 1; index < endIndex; index++)
            text[index].remove();

        // Delete everything before the end position
        (sortedRange.end.node as TextNode).deleteRange(0, sortedRange.end.index);

        // End with the start node, so it can determine where to place the caret after everything else is gone.
        const caret = (sortedRange.start.node as TextNode).deleteRange(sortedRange.start.index, (sortedRange.start.node as TextNode).text.length);

        // Merge any text nodes in this chapter to clean up any unnecessary boundaries after deletion.
        this.clean();

        // Return the new caret from the deleted end.
        return caret;

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
        const index = this.blocks.indexOf(anchor);
        if(index < 0)
            return;
        this.blocks.splice(index + 1, 0, block);
    }

    insertRule(range: CaretRange): Caret {

        const { start } = range;

        // If this is an empty text node in a paragraph node, then replace the paragraph node with a rule.
        if(start.node instanceof TextNode && start.node.parent instanceof FormattedNode && start.node.parent.parent instanceof ParagraphNode && start.node.text === "") {
            const paragraph: ParagraphNode = start.node.parent.parent as ParagraphNode;
            const rule = new RuleNode(paragraph.parent as BlockParentNode);
            paragraph.replaceWith(rule);
            return { node: rule, index: 0 };
        }
        return start;

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

        // If this isn't a selection, but rather a single point in a paragraph, and we're clearing formatting, just select the whole paragraph.
        if(format === "" && range.start.node === range.end.node && range.start.index === range.end.index) {
            const paragraph = range.start.node.getClosestParentMatching(p => p instanceof ParagraphNode) as ParagraphNode;
            if(paragraph) {
                const textPosition = paragraph.content.caretRangeToTextIndex(range.start);
                const text = paragraph.getNodes().filter(n => n instanceof TextNode) as TextNode[];
                if(text.length > 0) {
                    this.formatSelection({ start: { node: text[0], index: 0 }, end: { node: text[text.length - 1], index: text[text.length - 1].text.length }}, "");
                    const caret = paragraph.content.textIndexToCaret(textPosition);
                    return caret ? { start: caret, end: caret } : range;
                }
            }
        }

        // Sort them if they're out of order.
        const sortedRange = this.sortRange(range);

        // Find the selected paragraphs.
        const startParagraph = sortedRange.start.node.closestParent(ParagraphNode) as ParagraphNode;
        const endParagraph = sortedRange.end.node.closestParent(ParagraphNode) as ParagraphNode;

        // Don't do anything if we didn't find paragraphs or the paragraphs don't have the same parent.
        if(startParagraph === undefined || endParagraph === undefined || startParagraph.parent !== endParagraph.parent)
            return range;

        // If this is the same paragraph, just format it.
        if(startParagraph === endParagraph)
            return startParagraph.format(sortedRange, format);

        // If there's more than one paragraph, find all of the paragraph's to format.
        const startParagraphIndex = (startParagraph.parent as BlockParentNode).blocks.indexOf(startParagraph);
        const endParagraphIndex = (endParagraph.parent as BlockParentNode).blocks.indexOf(endParagraph);

        // Iterate through the list of blocks to find all of the paragraphs to format
        const paragraphs: Set<ParagraphNode> = new Set();
        (startParagraph.parent as BlockParentNode).blocks.forEach((block, index) => {
            if(block instanceof ParagraphNode && index > startParagraphIndex && index < endParagraphIndex)
                paragraphs.add(block);
        });

        // Format the start paragraph from the start to it's last text node.
        const lastStartTextNode = startParagraph.getLastTextNode();
        const newStartRange = startParagraph.format({ start: sortedRange.start, end: { node: lastStartTextNode, index: lastStartTextNode.text.length}}, format);
        let newEndRange = newStartRange;

        // If the end node is different from the start node, format from it's beginning to the end node.
        if(startParagraph !== endParagraph)
            newEndRange = endParagraph.format({ start: { node: endParagraph.getFirstTextNode(), index: 0 }, end: sortedRange.end}, format);    

        // Format the entirety of each inner paragraph.
        paragraphs.forEach(p =>  {
            const first = p.getFirstTextNode();
            const last = p.getLastTextNode();
            p.format({ start: { node: first, index: 0 }, end: { node: last, index: 0}}, format);
        });

        // Return the new range.
        return { start: newStartRange.start, end: newEndRange.end };

    }

}