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
import { CaretRange, TextRange } from "./Caret";

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

}