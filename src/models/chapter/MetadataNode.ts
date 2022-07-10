import { CaretRange } from "./Caret";
import { Node } from "./Node";
import { TextNode } from "./TextNode";

export abstract class MetadataNode<MetaType> extends Node {

    readonly #text: TextNode;
    readonly #meta: MetaType;
    
    constructor(text: TextNode, meta: MetaType) {
        super();
        this.#text = text;
        this.#meta = meta;
    }

    getMeta() { return this.#meta }
    getText() { return this.#text; }

    abstract withMeta(meta: MetaType): MetadataNode<MetaType>;
    abstract withText(text: TextNode): MetadataNode<MetaType>;
    abstract toText(): string;
    abstract toBookdown(): string;

    getChildren() { return [ this.#text ] }
    getParentOf(node: Node): Node | undefined { return this.#text === node ? this : undefined; }

    withChildReplaced(node: TextNode, replacement: TextNode | undefined) {
        if(this.#text === node && replacement !== undefined)
            return this.withText(replacement) as this;
    }

    withContentInRange(range: CaretRange): this | undefined { 
        const selectedText = this.#text.withContentInRange(range);
        if(selectedText === undefined) return undefined;
        return this.withText(selectedText) as this;    
    }

}