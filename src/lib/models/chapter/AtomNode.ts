import type Caret from "./Caret";
import FormatNode from "./FormatNode";
import Node from "./Node";
import TextNode from "./TextNode";
import type RootNode from "./RootNode";

export default abstract class AtomNode<MetadataType> extends Node {
    
    readonly #meta: MetadataType;

    constructor(meta: MetadataType) {
        super();
        this.#meta = meta;
    }

    getMeta() { return this.#meta; }

    abstract getDefaultCaret(): Caret | undefined;

    // Include the meta node if it's a node, to include it in normal operations.
    // We special case it in other places to avoid breaking other conventions (such as formatting changes, which
    // the atom node should be isolated from).
    getChildren() { return this.#meta instanceof Node ? [ this.#meta ] : [] }

    nextWord(root: RootNode): Caret {
        const next = root.getNextTextOrAtom(this);
        return next ?
            { node: next, index: 0 } :
            { node: this, index: 0 };
    }

    previousWord(root: RootNode): Caret {
        const previous = root.getPreviousTextOrAtom(this);
        return previous ?
            { node: previous, index: previous instanceof TextNode ? previous.getLength() : 0 } :
            { node: this, index: 0 };
    }

    getFormatRoot(root: Node): FormatNode | undefined {
        return this.getFarthestParentMatching(root, p => p instanceof FormatNode) as FormatNode;
    }

    getCaretPositionCount() { return 1; }

    abstract toBookdown(format?: FormatNode): string;
    abstract toText(): string;
    abstract withMeta(meta: MetadataType): AtomNode<MetadataType>;

}