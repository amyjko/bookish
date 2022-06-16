import { ChapterNode } from "./ChapterNode";
import { Caret } from "./Caret";
import { FormatNode } from "./FormatNode";
import { Node } from "./Node";
import { ParagraphNode } from "./ParagraphNode";
import { TextNode } from "./TextNode";

export abstract class AtomNode<MetadataType> extends Node<FormatNode> {    
    
    readonly #meta: MetadataType;

    constructor(meta: MetadataType) {
        super();
        this.#meta = meta;
    }

    getMeta() { return this.#meta; }

    abstract getDefaultCaret(): Caret;

    traverseChildren(fn: (node: Node) => void): void {}

    getRoot(root: Node): FormatNode | ChapterNode | undefined {
        const format = this.getFarthestParentMatching(root, p => p instanceof FormatNode) as FormatNode;
        const chapter = this.getFarthestParentMatching(root, p => p instanceof ChapterNode) as ChapterNode;
        return chapter ? chapter : format ? format : undefined;
    }

    nextWord(root: Node, index?: number): Caret {
        const next = this.getRoot(root)?.getNextTextOrAtom(this);
        return next ?
            { node: next, index: 0 } :
            { node: this, index: 0 };
    }

    previousWord(root: Node, index?: number): Caret {
        const previous = this.getRoot(root)?.getPreviousTextOrAtom(this);
        return previous ?
            { node: previous, index: previous instanceof TextNode ? previous.getLength() : 0 } :
            { node: this, index: 0 };
    }

    next(root: Node, index: number): Caret {
        return this.nextWord(root);
    }

    previous(root: Node, index: number): Caret {
        return this.previousWord(root);
    }

    getParagraph(root: Node): ParagraphNode | undefined {
        return this.getClosestParentMatching(root, p => p instanceof ParagraphNode) as ParagraphNode;
    }

    getFormatRoot(root: Node): FormatNode | undefined {
        return this.getFarthestParentMatching(root, p => p instanceof FormatNode) as FormatNode;
    }

    getLength() { return 1; }

    abstract toBookdown(parent: FormatNode, debug?: number): string;
    abstract toText(): string;
    abstract copy(): AtomNode<MetadataType>;
    abstract withMeta(meta: MetadataType): AtomNode<MetadataType>;

}
