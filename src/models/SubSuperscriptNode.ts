import { FormattedNode } from "./FormattedNode";
import { Node } from "./Node";

export class SubSuperscriptNode extends Node<FormattedNode> {

    #superscript: boolean;
    #content: FormattedNode | undefined;

    constructor(parent: FormattedNode, superscript: boolean) {
        super(parent, "script");
        this.#superscript = superscript;
    }

    getContent() { return this.#content; }
    isSuperscript() { return this.#superscript; }

    setContent(content: FormattedNode) {
        this.#content = content;
    }

    toText(): string {
        return this.#content ? this.#content.toText() : "";
    }

    toBookdown(): String {
        return `^${!this.#superscript ? "v" : ""}${this.#content?.toBookdown()}^`;
    }

    traverseChildren(fn: (node: Node) => void): void {
        this.#content?.traverse(fn)
    }

    removeChild(node: Node): void {
        if(this.#content === node) this.remove();
    }

    replaceChild(node: Node, replacement: FormattedNode): void {
        if(this.#content === node)
            this.#content = replacement;
    }

    getSiblingOf(child: Node, next: boolean) { return undefined; }

    copy(parent: FormattedNode): SubSuperscriptNode {
        const node = new SubSuperscriptNode(parent, this.#superscript)
        if(this.#content) node.setContent(this.#content.copy(node));
        return node;
    }

    clean() {}

}
