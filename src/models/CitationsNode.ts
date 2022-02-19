import { FormattedNode } from "./FormattedNode";
import { Node } from "./Node";


export class CitationsNode extends Node<FormattedNode> {
    
    #citations: string[];
    
    constructor(parent: FormattedNode, citations: Array<string>) {
        super(parent, "citations");
        this.#citations = citations;
    }

    toText(): string {
        return "";
    }

    getCitations() { return this.#citations; }

    toBookdown(): String {
        return "<" + this.#citations.join(",") + ">"
    }    

    traverseChildren(fn: (node: Node) => void): void {}

    removeChild(node: Node): void {}
    getSiblingOf(child: Node, next: boolean) { return undefined; }
    replaceChild(node: Node, replacement: Node): void {}

    copy(parent: FormattedNode): CitationsNode {
        return new CitationsNode(parent, [...this.#citations])
    }

    clean() {
        if(this.#citations.length === 0) this.remove();
    }

}
