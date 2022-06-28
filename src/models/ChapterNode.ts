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
import { Edit } from "./Edit";

export class ChapterNode extends BlocksNode {

    #metadata: Bookkeeping;

    constructor(blocks: BlockNode[], metadata?: Bookkeeping) {
        super(blocks);

        // Content extracted during parsing.
        this.#metadata = metadata === undefined ? { symbols: {} } : metadata;

    }

    getType() { return "chapter"; }
    getFormats(): FormatNode[] { return []; }
    getChapter() { return this; }

    create(blocks: BlockNode[]): BlocksNode {
        return new ChapterNode(blocks, this.#metadata);
    }

    getNode(id: number) { return this.getNodes().find(n => n.getID() === id); }
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
    textRangeToCaret(range: TextRange): CaretRange | undefined {
        const start = this.getTextIndexAsCaret(range.start);
        const end = this.getTextIndexAsCaret(range.end);
        if(start === undefined || end === undefined) return;
        return { start: start, end: end }; 
    }

    caretRangeToTextRange(range: CaretRange): TextRange {
        return { start: this.getTextIndexOfCaret(range.start), end: this.getTextIndexOfCaret(range.end) };
    }

    getNextTextOrAtom(node: TextNode | AtomNode<any>): TextNode | AtomNode<any> | undefined {
        // Otherwise, find the next text node after this one.
        const nodes = this.getTextAndAtomNodes();
        const index = nodes.indexOf(node);
        return index === undefined ? undefined :
            index < nodes.length - 1 ? nodes[index + 1] :
            undefined;
    }

    getPreviousTextOrAtom(node: TextNode | AtomNode<any>): TextNode | AtomNode<any> | undefined {
        // Otherwise, find the next text node after this one.
        const nodes = this.getTextAndAtomNodes();
        const index = nodes.indexOf(node);
        return index === undefined ? undefined :
            index > 0 ? nodes[index - 1] :
            undefined;
    }

    getChildren() { return this.blocks }

    withChildReplaced(node: BlockNode, replacement: BlockNode | undefined) {

        const index = this.blocks.indexOf(node);

        /// If we couldn't find the requested node, don't change anything.
        if(index < 0)
            return undefined;

        // Make a new blocks node, assigning and re-parenting the replacement.
        const blocks = replacement === undefined ?
            [ ...this.blocks.slice(0, index), ...this.blocks.slice(index + 1)] :
            [ ...this.blocks.slice(0, index), replacement, ...this.blocks.slice(index + 1) ];

        return new ChapterNode(blocks, this.#metadata) as this;

    }

    copy() {
        return new ChapterNode(this.blocks.map(b => b.copy()), this.#metadata) as this;
    }

    copyRange(range: CaretRange): Node | undefined {
        const sortedRange = this.sortRange(range);
        // Find the common ancestor of the range, then ask it to copy the portion of it selected and produce a node.
        const commonAncestor = sortedRange.start.node.getCommonAncestor(this, sortedRange.end.node);
        if(commonAncestor === undefined) return;
        return commonAncestor.withContentInRange(sortedRange);
    }
    
}