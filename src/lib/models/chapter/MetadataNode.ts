import type { CaretRange } from './Caret';
import Node from './Node';
import type TextNode from './TextNode';

export default abstract class MetadataNode<MetaType = any> extends Node {
    readonly #text: TextNode;
    readonly #meta: MetaType;

    constructor(text: TextNode, meta: MetaType) {
        super();
        this.#text = text;
        this.#meta = meta;
    }

    getMeta() {
        return this.#meta;
    }
    getText() {
        return this.#text;
    }

    abstract withMeta(meta: MetaType): MetadataNode;
    abstract withText(text: TextNode): MetadataNode;
    abstract toText(): string;
    abstract toBookdown(): string;

    getChildren() {
        return [this.#text];
    }
    getParentOf(node: Node): Node | undefined {
        return this.#text === node ? this : undefined;
    }

    withChildReplaced(node: TextNode, replacement: TextNode | undefined) {
        if (this.#text === node && replacement !== undefined)
            return this.withText(replacement) as this;
    }

    withContentInRange(range: CaretRange): this | undefined {
        const selectedText = this.#text.withContentInRange(range);
        if (selectedText === undefined) return undefined;
        return this.withText(selectedText) as this;
    }
}
