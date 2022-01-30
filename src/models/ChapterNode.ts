import { Bookkeeping, BlockNode } from "./Parser";
import { ErrorNode } from "./ErrorNode";
import { TextNode } from "./TextNode";
import { FootnoteNode } from "./FootnoteNode";
import { HeaderNode } from "./HeaderNode";
import { EmbedNode } from "./EmbedNode";
import { Node } from "./Node";

export type Selection = { startID: number, startIndex: number, endID: number, endIndex: number }
export type CaretPosition = { node: number, index: number}

export class ChapterNode extends Node {
    blocks: Array<Node>;
    metadata: Bookkeeping;
    index: Map<number, Node>;
    nextID: number;

    constructor(blocks: Array<BlockNode>, metadata: Bookkeeping) {
        super(undefined, "chapter");

        // The AST of the chapter.
        this.blocks = blocks;

        // Content extracted during parsing.
        this.metadata = metadata;

        // Start the node index empty
        this.index = new Map();

        // Start next ID at 0
        this.nextID = 0;

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

    insert(char: string, position: Selection) {

        // Find the nodes corresponding to the given node IDs.
        const start = this.getNode(position.startID);
        const end = this.getNode(position.endID);

        // Couldn't find the nodes? Don't do anything.
        if (start === undefined || end === undefined)
            return undefined;

        // If start and end are different, there's a selection. Delete it first.
        if (start !== end || position.startIndex !== position.endIndex) {
            this.removeSelection(position, false);
        }

        // After deleting the selection, Insert the character.
        if (start instanceof TextNode) {
            return start.insert(char, position.startIndex);
        }

    }

    removeSelection(position: Selection, forward: boolean) {

        let start = this.getNode(position.startID);
        let end = this.getNode(position.endID);

        // Couldn't find the nodes? Don't do anything.
        if (start === undefined || end === undefined)
            return undefined;
    
        // If the start and end are the same, delete within the node.
        if(start === end) {
            if(start instanceof TextNode) {
                // If the positions are the same, we're just doing a single character backspace or delete.
                if(position.startIndex === position.endIndex) {
                    return start.removeRange(position.startIndex, 1, forward);
                }
                // If not, remove a sequence of characters.
                else {
                    // They can be given out of order, so sort them.
                    const first = Math.min(position.startIndex, position.endIndex)
                    const last = Math.max(position.startIndex, position.endIndex)

                    // Remove the text
                    return start.removeRange(first, last - first, true)
                }
            }
        }
        // If the start and end nodes are different, delete everything between them, and the corresponding parts of each.
        else if(start instanceof TextNode && end instanceof TextNode) {

            const textNodes = this.getTextNodes()
            // If they're out of order, swap them. This can happen because the browser lets selections happen in any order.
            if(textNodes.indexOf(start) > textNodes.indexOf(end)) {
                const temp = start; start = end; end = temp;
                const tempIndex = position.startIndex; position.startIndex = position.endIndex; position.endIndex = tempIndex
            }

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

            // Remove any nodes whose parents are also in the list, as they would be redundant to delete.
            const redundantNodesToDelete: Set<Node> = new Set()
            nodesToDelete.forEach(node1 => {
                nodesToDelete.forEach(node2 => {
                    if(node1 !== node2 && node1.hasParent(node2))
                        redundantNodesToDelete.add(node1)
                })
            })

            // Remove any redundant nodes from the deletion list.
            redundantNodesToDelete.forEach(node => nodesToDelete.delete(node))

            // Delete everything in the middle
            nodesToDelete.forEach(node => node.remove())

            // Delete everything before the end position
            if(end instanceof TextNode)
                end.removeRange(0, position.endIndex, true)
        
            // End with the start node, so it can determine where to place the caret after everything else is gone.
            if(start instanceof TextNode)
                return start.removeRange(position.startIndex, start.text.length - position.startIndex, true)
        
            return undefined

        }

    }

    toText(): string {
        return this.blocks.map(block => block.toText()).join(" ");
    }

    traverseChildren(fn: (node: Node) => void): void {
        this.blocks.forEach(item => item.traverse(fn) )
    }

    removeChild(node: Node): void {
        this.blocks = this.blocks.filter(item => item !== node)
    }

    getNodes(): Node[] {
        const nodes: Node[] = [];
        this.traverse(node => nodes.push(node));
        return nodes;
    }

    getTextNodes(): TextNode[] {
        return this.getNodes().filter(node => node instanceof TextNode) as TextNode[]
    }

}