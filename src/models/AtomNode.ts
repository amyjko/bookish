import { FormattedNode } from "./FormattedNode";
import { Node } from "./Node";
import { NodeType } from "./Parser";


export abstract class AtomNode<MetadataType> extends Node<FormattedNode> {    
    #meta: MetadataType;

    constructor(parent: FormattedNode, meta: MetadataType, type: NodeType) {
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

    abstract toBookdown(): string;
    abstract toText(): string;
    abstract copy(parent: FormattedNode): AtomNode<any>;

}
