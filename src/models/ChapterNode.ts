import { Bookkeeping, BlockNode } from "./Parser";
import { ErrorNode } from "./ErrorNode";
import { TextNode } from "./TextNode";
import { FootnoteNode } from "./FootnoteNode";
import { HeaderNode } from "./HeaderNode";
import { EmbedNode } from "./EmbedNode";
import { Node } from "./Node";
import { ParagraphNode } from "./ParagraphNode";
import { ContentNode } from "./ContentNode";
import { Format, FormattedNode, FormattedNodeSegmentType } from "./FormattedNode";

export type Selection = { startID: number, startIndex: number, endID: number, endIndex: number }
export type CaretPosition = { node: number, index: number}
type Range = { start: Node, startIndex: number, end: Node, endIndex: number }

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

    traverseChildren(fn: (node: Node) => void): void {
        this.blocks.forEach(item => item.traverse(fn) )
    }

    removeChild(node: Node): void {
        this.blocks = this.blocks.filter(item => item !== node)
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

    deleteBackward(index: number | Node | undefined): CaretPosition | undefined {
        return undefined;
    }

    deleteForward(index: number | Node | undefined): CaretPosition | undefined {
        return undefined;
    }

    deleteRange(start: number, end: number): CaretPosition {
        return { node: this.nodeID, index: 0};
    }

    insert(symbol: string, index: number): CaretPosition | undefined {
        
        // If there are no blocks, create one empty paragraph block.
        if(this.blocks.length === 0)
            this.blocks.push(new ParagraphNode(this));

        // If there is paragraph node, have it insert a character.
        return this.blocks[0].insert(symbol, 0);

    }

    getRange(selection: Selection): Range | undefined {

        // Find the nodes corresponding to the given node IDs.
        let start = this.getNode(selection.startID);
        let end = this.getNode(selection.endID);
        let startIndex = selection.startIndex;
        let endIndex = selection.endIndex;

        // Couldn't find the nodes? Don't do anything.
        if (start === undefined || end === undefined)
            return undefined;

        // Try to convert the nodes TextNodes if they aren't.
        if(!(start instanceof TextNode)) {
            const text = start.getNodes().filter(n => n instanceof TextNode) as TextNode[];
            if(text.length > 0) {
                start = text[0];
                startIndex = 0;
            }
        }
        if(!(end instanceof TextNode)) {
            const text = end.getNodes().filter(n => n instanceof TextNode) as TextNode[];
            if(text.length > 0) {
                end = text[text.length - 1];
                endIndex = text[text.length - 1].text.length;
            }
        }

        // If the nodes are out of order, swap them and their indices. This can happen because the browser lets selections happen in any order.
        const nodes = this.getNodes();
        if(nodes.indexOf(start) > nodes.indexOf(end)) {
            [ start, end ] = [ end, start ];
            [ startIndex, endIndex ] = [ endIndex, startIndex ];
        }
        // If the nodes are the same but have out of order indices, swap them.
        else if(start === end && startIndex > endIndex) {
            [ startIndex, endIndex ] = [ endIndex, startIndex ];
        }

        // Return the range.
        return {
            start: start,
            startIndex: startIndex,
            end: end,
            endIndex: endIndex
        }
        
    }

    insertSelection(char: string, position: Selection): CaretPosition | undefined {

        const range = this.getRange(position);
        if(!range) return;

        // If there's a selection, remove it before inserting.
        if (range.start !== range.end || position.startIndex !== position.endIndex)
            this.removeRange(range);

        // Insert at the start position.
        return range.start.insert(char, position.startIndex);

    }

    deleteSelection(position: Selection, backward: boolean): CaretPosition | undefined {

        const range = this.getRange(position);
        if(!range) return;
    
        // If the start and end are the same, delete within the node.
        if(range.start === range.end) {

            // If the positions are the same, just do a single character.
            // Otherwise, do a range.
            return position.startIndex === position.endIndex ? 
                backward ? 
                    range.start.deleteBackward(position.startIndex) : 
                    range.start.deleteForward(position.startIndex) :
                    range.start.deleteRange(position.startIndex, position.endIndex);

        }
        // If the start and end positions are different, delete everything between them, and the corresponding parts of each.
        else return this.removeRange(range)

    }

    // Remove everything between the two different nodes.
    removeRange(range: Range) : CaretPosition {

        let { start, startIndex, end, endIndex } = range;

        // If the start and end positions are different, delete everything between them, and the corresponding parts of each.
        if(start instanceof TextNode && end instanceof TextNode) {

            if(start === end) {
                return end.deleteRange(startIndex, endIndex);
            }
            else {

                // Traverse the chapter finding everything between the two nodes
                enum Mode { SEARCHING_FOR_START, SEARCHING_FOR_TEXT_AFTER_START, TRACKING_BETWEEN, DONE }
                let mode: Mode = Mode.SEARCHING_FOR_START;
                const nodesToDelete: Set<Node> = new Set()
                this.traverse(node => {
                    if(node === start)
                        mode = Mode.SEARCHING_FOR_TEXT_AFTER_START
                    else if(node === end)
                        mode = Mode.DONE
                    else if(mode === Mode.SEARCHING_FOR_TEXT_AFTER_START && node instanceof TextNode)
                        mode = Mode.TRACKING_BETWEEN;
                    // If we're tracking in between, add the current node!
                    if(mode === Mode.TRACKING_BETWEEN)
                        nodesToDelete.add(node)
                })

                // Don't delete children whose parents are being deleted.
                this.removeRedundantChildren(nodesToDelete);

                // Delete everything in the middle
                nodesToDelete.forEach(node => node.remove())

                // Delete everything before the end position
                end.deleteRange(0, endIndex);
            
                // End with the start node, so it can determine where to place the caret after everything else is gone.
                return start.deleteRange(startIndex, (start as TextNode).text.length)

            }
        
        }
        else throw Error("Don't know how to delete between things that aren't text nodes.")

    }

    splitSelection(position: Selection) {

        const range = this.getRange(position);
        if(!range) return;

        const { start, end } = range;

        // If there's a selection, remove it before inserting.
        if (start !== end || position.startIndex !== position.endIndex)
            this.removeRange(range);

        let caret: CaretPosition | undefined = {
            node: position.startID,
            index: position.startIndex
        }
    
        // If there's a paragraph remaining, then split it.
        if(caret && caret.node) {

            // Find the current node
            let node = this.getNode(caret.node)
            if(node === undefined) return undefined;

            // Find what paragraph it's in.
            let paragraph = node.closestParent<ParagraphNode>(ParagraphNode);
            if(paragraph === undefined) return undefined;

            // Find what index this node is in the paragraph so we can find its doppleganger in the copy.
            const positionNodeIndex  = paragraph.getNodes().indexOf(node)

            // Begin by duplicating the paragraph.
            const copy = paragraph.copy(this);

            // Insert the copy after the original.
            this.blocks.splice(this.blocks.indexOf(paragraph) + 1, 0, copy)

            // Delete everything after the caret in the original paragraph.
            const textNodes = paragraph.getNodes().filter(n => n instanceof TextNode);
            const lastTextNode = textNodes.length > 0 ? textNodes[textNodes.length - 1] as TextNode : undefined;
            // If we found a text node, delete
            if(lastTextNode && lastTextNode.nodeID && (caret.node !== lastTextNode.nodeID || caret.index !== lastTextNode.text.length))
                this.deleteSelection({ startID: caret.node, startIndex: caret.index, endID: lastTextNode.nodeID, endIndex: lastTextNode.text.length}, false)

            // Delete everything before the caret in the copy.
            const dupeNodes = copy.getNodes()
            const dupeTextNodes = dupeNodes.filter(n => n instanceof TextNode);
            const firstTextNode = dupeTextNodes.length > 0 ? dupeTextNodes[0] as TextNode : undefined;
            const newNodePosition = dupeNodes[positionNodeIndex];

            if(firstTextNode && firstTextNode.nodeID && newNodePosition && newNodePosition.nodeID) {
                // If there's anything to delete, delete it.
                if(firstTextNode.nodeID !== newNodePosition.nodeID || caret.index !== 0)
                    return this.deleteSelection({ startID: firstTextNode.nodeID, startIndex: 0, endID: newNodePosition.nodeID, endIndex: caret.index}, false);
                // Otherwise, just position the caret at the beginning of the copy.
                else
                    return { node: firstTextNode.nodeID, index: 0 }

            }

        }

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

    formatSelection(selection: Selection, format: Format): CaretPosition | [ CaretPosition, CaretPosition ] | undefined {

        // Convert the node IDs into Nodes
        const range = this.getRange(selection);
        if(!range) return;

        const start: TextNode = range.start as TextNode;
        const startIndex = range.startIndex;
        const end: TextNode = range.end as TextNode;
        const endIndex = range.endIndex;

        // We only support formatting changes on text nodes in the same paragraph.
        const startParagraph = start.closestParent(ParagraphNode);
        const endParagraph = end.closestParent(ParagraphNode);
        if(!startParagraph || !endParagraph || startParagraph !== endParagraph)
            return;

        // Find the ContentNode that contains them all. No need to deal with other nodes.
        const ancestor = start.getCommonAncestor(end);
        if(!ancestor)
            return;

        // Find all of the selected non-empty text nodes that are and are not formatted.
        const nodes = ancestor.getNodes();
        const selectedTextNodes: TextNode[] = nodes.filter(n => n instanceof TextNode && (n === start || n === end || (nodes.indexOf(n) > nodes.indexOf(start) && nodes.indexOf(n) < nodes.indexOf(end)))) as TextNode[];
        const formattedTextNodes = new Set<TextNode>(selectedTextNodes.filter(n => n.text.length > 0 && n.getClosestParentMatching(p => p instanceof FormattedNode && p.format === format) !== undefined));
        let unformattedTextNodes = new Set<TextNode>(selectedTextNodes.filter(n => n.text.length > 0 && n.getClosestParentMatching(p => p instanceof FormattedNode && p.format === format) === undefined));
        const unformattedEmptyNodes = new Set<TextNode>(selectedTextNodes.filter(n => n.getClosestParentMatching(p => p instanceof FormattedNode && p.format === format) === undefined));

        // We special case having only empty nodes so that we can format on empty content nodes.
        // Otherwise, we exclude them, as they prevent unformatting from occurring, since they're never formatted.
        if(unformattedTextNodes.size === 0 && unformattedEmptyNodes.size > 0)
            unformattedTextNodes = unformattedEmptyNodes;

        // If some are unformatted, format the selected portions of all of them.
        if(unformattedTextNodes.size > 0) {
            // Don't format children whose parents are to be formatted.
            this.removeRedundantChildren(unformattedTextNodes);

            let startCaret = { node: start.nodeID, index: startIndex }, endCaret = { node: end.nodeID, index: endIndex };
            unformattedTextNodes.forEach(text => {
                // If start and end are the same, wrap it.
                if(text === start && start === end) {
                    const formatted = new FormattedNode(start.parent as ContentNode, format, []);
                    start.wrap(startIndex, endIndex, formatted);
                    // Set the caret to the beginning and end of the formatted node.
                    startCaret = { node: formatted.nodeID, index: 0 }
                    endCaret = { node: formatted.nodeID, index: formatted.segments.length }
                }
                // If this is a unique start, wrap the selected part.
                else if(text === start) {
                    const formatted = new FormattedNode(start.parent as ContentNode, format, []);
                    start.wrap(startIndex, start.text.length, formatted);
                    startCaret = { node: formatted.nodeID, index: 0 }
                }
                // If this is a unique end, wrap the selected part.
                else if(text === end) {
                    const formatted = new FormattedNode(end.parent as ContentNode, format, []);
                    end.wrap(0, endIndex, formatted);
                    endCaret = { node: formatted.nodeID, index: formatted.segments.length }
                }
                // Otherwise, wrap the entire text.
                else
                    text.wrap(0, text.text.length, new FormattedNode(text.parent as ContentNode, format, []))
            });

            return [ startCaret, endCaret ];
        }
        // To unformat text, unformat everything, and then format anything left or right of the formatted node that should have stayed selected.
        else {

            // Don't redundantly process children whose parents are being handled already.
            this.removeRedundantChildren(formattedTextNodes);

            // Find the formatted nodes affecting everything and unwrap them.
            const formatting = new Set<FormattedNode>();
            formattedTextNodes.forEach(text => {
                // Find the formatting affecting this text.
                const formatted = text.getClosestParentMatching(p => p instanceof FormattedNode && p.format === format) as FormattedNode;
                if(formatted) 
                    formatting.add(formatted);
            });

            let startCaret: CaretPosition | undefined = undefined, endCaret: CaretPosition | undefined = undefined;

            // Wrap all of the unselected nodes and unwrap their formatting wrappers.
            formatting.forEach(f => {

                // Get all of the nodes in this FormattingNode.
                const formattingNodes = f.getNodes();

                // Find all of the nodes that aren't part of the selection.
                const unselected = formattingNodes.filter(n => 
                        // Must be text
                        n instanceof TextNode &&
                        // Must be before the start node or after the end node
                        (nodes.indexOf(n) < nodes.indexOf(start) || nodes.indexOf(n) > nodes.indexOf(end))) as TextNode[];

                // Format each of the the unselected nodes 
                unselected.forEach(text => text.wrap(0, text.text.length, new FormattedNode(text.parent as ContentNode, format, [])));

                // If the start node is in this FormattedNode, wrap the parts of it that aren't selected.
                if(start.hasParent(f)) {
                    // If the start and end are the same, then also format the end. Do these first before we
                    // mangle the end by wrapping the start.
                    if(start === end) {
                        if(endIndex <= end.text.length) {
                            const formatted = new FormattedNode(start.parent as ContentNode, format, []);
                            end.wrap(endIndex, end.text.length, formatted);
                            // Place the end caret outside the FormattedNode to allow for unformatted inserts.
                            const formattedIndex = (formatted.parent as ContentNode)?.segments.indexOf(formatted);
                            startCaret = endCaret = { node: (formatted.parent as ContentNode)?.segments[formattedIndex + 1].nodeID, index: 0 };
                        } else
                            endCaret = { node: end.nodeID, index: endIndex };
                    }
                    // Wrap the beginning of the text.
                    if(startIndex > 0) {
                        const formatted = new FormattedNode(start.parent as ContentNode, format, []);
                        start.wrap(0, startIndex, formatted);
                    }
                    if(startCaret === undefined) 
                        startCaret = { node: start.nodeID, index: startIndex }
                }
                // If the end node is different from the start node and is in this formatted node, wrap the parts that aren't selected.
                else if(start !== end && end.hasParent(f)) {
                    if(endIndex <= end.text.length) {
                        const formatted = new FormattedNode(start.parent as ContentNode, format, []);
                        end.wrap(endIndex, end.text.length, formatted);
                        endCaret = { node: formatted.nodeID, index: formatted.segments.length };
                    }
                    else endCaret = { node: end.nodeID, index: end.text.length }
                }

                // Unwrap the formatted node now that we've wrapped everything else.
                f.unwrap();

            });

            return startCaret && endCaret ? [ startCaret, endCaret ] : { node: start.nodeID, index: startIndex };

        }

    }

}