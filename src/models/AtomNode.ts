import { Caret } from "./Caret";
import { FormatNode } from "./FormatNode";
import { Node } from "./Node";
import { ParagraphNode } from "./ParagraphNode";
import { TextNode } from "./TextNode";
import { RootNode } from "./RootNode";

export abstract class AtomNode<MetadataType> extends Node {
    
    readonly #meta: MetadataType;

    constructor(meta: MetadataType) {
        super();
        this.#meta = meta;
    }

    getMeta() { return this.#meta; }

    abstract getDefaultCaret(): Caret;

    traverseChildren(fn: (node: Node) => void): void {}

    nextWord(root: RootNode, index?: number): Caret {
        const next = root.getNextTextOrAtom(this);
        return next ?
            { node: next, index: 0 } :
            { node: this, index: 0 };
    }

    previousWord(root: RootNode, index?: number): Caret {
        const previous = root.getPreviousTextOrAtom(this);
        return previous ?
            { node: previous, index: previous instanceof TextNode ? previous.getLength() : 0 } :
            { node: this, index: 0 };
    }

    next(root: RootNode, index: number): Caret {
        return this.nextWord(root);
    }

    previous(root: RootNode, index: number): Caret {
        return this.previousWord(root);
    }

    getParagraph(root: Node): ParagraphNode | undefined {
        return this.getClosestParentMatching(root, p => p instanceof ParagraphNode) as ParagraphNode;
    }

    getFormatRoot(root: Node): FormatNode | undefined {
        return this.getFarthestParentMatching(root, p => p instanceof FormatNode) as FormatNode;
    }

    getLength() { return 1; }

    abstract toBookdown(debug?: number, format?: FormatNode): string;
    abstract toText(): string;
    abstract copy(): AtomNode<MetadataType>;
    abstract withMeta(meta: MetadataType): AtomNode<MetadataType>;

}