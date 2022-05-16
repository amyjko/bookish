import { ChapterNode } from "./ChapterNode";
import { Caret } from "./Caret";
import { FormatNode } from "./FormatNode";
import { Node } from "./Node";
import { ParagraphNode } from "./ParagraphNode";
import { NodeType } from "./NodeType";
import { TextNode } from "./TextNode";


export abstract class AtomNode<MetadataType> extends Node<FormatNode> {    
    #meta: MetadataType;

    constructor(parent: FormatNode, meta: MetadataType, type: NodeType) {
        super(parent, type);
        this.#meta = meta;
    }

    getMeta() { return this.#meta; }
    setMeta(meta: MetadataType) { this.#meta = meta; }

    traverseChildren(fn: (node: Node) => void): void {}
    removeChild(node: Node<Node<any>>): void {}
    replaceChild(node: Node<Node<any>>, replacement: Node<Node<any>>): void {}
    getSiblingOf(child: Node<Node<any>>, next: boolean): Node<Node<any>> | undefined { return undefined; }
    clean(): void {}

    getRoot(): FormatNode | ChapterNode | undefined {
        const format = this.getFarthestParentMatching(p => p instanceof FormatNode) as FormatNode;
        const chapter = this.getFarthestParentMatching(p => p instanceof ChapterNode) as ChapterNode;
        return chapter ? chapter : format ? format : undefined;
    }

    nextWord(index?: number): Caret {
        const next = this.getRoot()?.getNextTextOrAtom(this);
        return next ?
            { node: next, index: 0 } :
            { node: this, index: 0 };
    }

    previousWord(index?: number): Caret {
        const previous = this.getRoot()?.getPreviousTextOrAtom(this);
        return previous ?
            { node: previous, index: previous instanceof TextNode ? previous.getLength() : 0 } :
            { node: this, index: 0 };
    }

    deleteForward(): Caret {
        const root = this.getRoot();
        const next = root?.getNextTextOrAtom(this);
        const previous = root?.getNextTextOrAtom(this);

        if(next) {
            this.remove();
            return { node: next, index: 0 };
        }
        if(previous) {
            this.remove();
            return { node: previous, index: previous instanceof TextNode ? previous.getLength() : 0 };
        }

        // All alone, don't do anything.
        return { node: this, index: 0 };
            
    }

    deleteBackward(): Caret {
        const root = this.getRoot();
        const next = root?.getPreviousTextOrAtom(this);
        const previous = root?.getPreviousTextOrAtom(this);

        if(previous) {
            this.remove();
            return { node: previous, index: previous instanceof TextNode ? previous.getLength() : 0 };
        }
        if(next) {
            this.remove();
            return { node: next, index: 0 };
        }

        // All alone, don't do anything.
        return { node: this, index: 0 };
    }

    next(index: number): Caret {
        return this.nextWord();
    }

    previous(index: number): Caret {
        return this.previousWord();
    }

    getParagraph(): ParagraphNode | undefined {
        return this.getClosestParentMatching(p => p instanceof ParagraphNode) as ParagraphNode;
    }

    getFormatRoot(): FormatNode | undefined {
        return this.getFarthestParentMatching(p => p instanceof FormatNode) as FormatNode;
    }

    getLength() { return 1; }

    abstract toBookdown(debug?: number): string;
    abstract toText(): string;
    abstract copy(parent: FormatNode): AtomNode<any>;

}
