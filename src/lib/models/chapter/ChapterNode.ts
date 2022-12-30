import type Bookkeeping from './Bookkeeping';
import type BlockNode from './BlockNode';
import ErrorNode from './ErrorNode';
import type TextNode from './TextNode';
import FootnoteNode from './FootnoteNode';
import EmbedNode from './EmbedNode';
import ParagraphNode from './ParagraphNode';
import type AtomNode from './AtomNode';
import CitationsNode from './CitationsNode';
import LabelNode from './LabelNode';
import CommentNode from './CommentNode';
import BlocksNode from './BlocksNode';

export default class ChapterNode extends BlocksNode {
    #metadata: Bookkeeping;

    constructor(blocks: BlockNode[], metadata?: Bookkeeping) {
        super(blocks);

        // Content extracted during parsing.
        this.#metadata = metadata === undefined ? { symbols: {} } : metadata;
    }

    getType() {
        return 'chapter';
    }
    getChapter() {
        return this;
    }

    create(blocks: BlockNode[]): BlocksNode {
        return new ChapterNode(blocks, this.#metadata);
    }

    getErrors(): ErrorNode[] {
        return this.getNodes().filter(
            (n) => n instanceof ErrorNode
        ) as ErrorNode[];
    }
    getCitations(): Set<string> {
        const citations = new Set<string>();
        (
            this.getNodes().filter(
                (n) => n instanceof CitationsNode
            ) as CitationsNode[]
        ).forEach((cites) =>
            cites.getMeta().forEach((citationID) => citations.add(citationID))
        );
        return citations;
    }
    getFootnotes(): FootnoteNode[] {
        return this.getNodes().filter(
            (n) => n instanceof FootnoteNode
        ) as FootnoteNode[];
    }
    getHeaders(): ParagraphNode[] {
        return this.getNodes().filter(
            (n) => n instanceof ParagraphNode && n.getLevel() > 0
        ) as ParagraphNode[];
    }
    getEmbeds(): EmbedNode[] {
        return this.getNodes().filter(
            (n) => n instanceof EmbedNode
        ) as EmbedNode[];
    }
    getComments(): CommentNode[] {
        return this.getNodes().filter(
            (n) => n instanceof CommentNode
        ) as CommentNode[];
    }

    getLabels(): LabelNode[] {
        return this.getNodes().filter(
            (n) => n instanceof LabelNode
        ) as LabelNode[];
    }

    hasLabel(labelID: string) {
        return (
            this.getLabels().find((label) => label.getMeta() === labelID) !==
            undefined
        );
    }

    getCitationNumber(citationID: string) {
        const index = Array.from(this.getCitations())
            .sort()
            .indexOf(citationID);
        return index < 0 ? null : index + 1;
    }

    toText(): string {
        return this.getBlocks()
            .map((block) => block.toText())
            .join(' ');
    }

    toBookdown(): string {
        // Render the symbols then all the blocks
        return (
            Object.keys(this.#metadata.symbols)
                .sort()
                .map((name) => `@${name}: ${this.#metadata.symbols[name]}\n\n`)
                .join('') +
            this.getBlocks()
                .map((b) => b.toBookdown())
                .join('\n\n')
        );
    }

    getNextTextOrAtom(
        node: TextNode | AtomNode<any>
    ): TextNode | AtomNode<any> | undefined {
        // Otherwise, find the next text node after this one.
        const nodes = this.getTextAndAtomNodes();
        const index = nodes.indexOf(node);
        return index === undefined
            ? undefined
            : index < nodes.length - 1
            ? nodes[index + 1]
            : undefined;
    }

    getPreviousTextOrAtom(
        node: TextNode | AtomNode<any>
    ): TextNode | AtomNode<any> | undefined {
        // Otherwise, find the next text node after this one.
        const nodes = this.getTextAndAtomNodes();
        const index = nodes.indexOf(node);
        return index === undefined
            ? undefined
            : index > 0
            ? nodes[index - 1]
            : undefined;
    }

    getChildren() {
        return this.getBlocks();
    }

    withChildReplaced(node: BlockNode, replacement: BlockNode | undefined) {
        const index = this.getBlocks().indexOf(node);

        /// If we couldn't find the requested node, don't change anything.
        if (index < 0) return undefined;

        // Make a new blocks node, assigning and re-parenting the replacement.
        const blocks =
            replacement === undefined
                ? [
                      ...this.getBlocks().slice(0, index),
                      ...this.getBlocks().slice(index + 1),
                  ]
                : [
                      ...this.getBlocks().slice(0, index),
                      replacement,
                      ...this.getBlocks().slice(index + 1),
                  ];

        return new ChapterNode(blocks, this.#metadata) as this;
    }

    copy() {
        return new ChapterNode(
            this.getBlocks().map((b) => b.copy()),
            this.#metadata
        ) as this;
    }
}
