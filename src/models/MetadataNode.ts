import { Node } from "./Node";
import { TextNode } from "./TextNode";

export abstract class MetadataNode<MetaType> extends Node {

    readonly #text: TextNode;
    readonly #meta: MetaType;
    
    constructor(text: string, meta: MetaType) {
        super();
        this.#text = new TextNode(text);
        this.#meta = meta;
    }

    getMeta() { return this.#meta }
    getText() { return this.#text; }

    abstract withMeta(meta: MetaType): MetadataNode<MetaType>;
    abstract withText(text: string): MetadataNode<MetaType>;
    abstract toText(): string;
    abstract toBookdown(debug?: number): string;

    getChildren() { return [ this.#text ] }

}
