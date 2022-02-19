import { FormattedNode } from "./FormattedNode";
import { Node } from "./Node";


export class LabelNode extends Node<FormattedNode> {
    
    #id: string;

    constructor(parent: FormattedNode, id: string) {
        super(parent, "label");
        this.#id = id;
    }

    getID() { return this.#id; }

    toText(): string { return ""; }

    toBookdown(): String {
        return `:${this.#id}`;
    }

    traverseChildren(fn: (node: Node) => void): void {}
    
    removeChild(node: Node): void {}
    
    replaceChild(node: Node, replacement: Node): void {}

    getSiblingOf(child: Node, next: boolean) { return undefined; }

    copy(parent: FormattedNode): LabelNode {
        return new LabelNode(parent, this.#id)
    }

    clean() {
        if(this.#id.length === 0) this.remove();
    }

}
