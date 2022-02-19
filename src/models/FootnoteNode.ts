import { Node } from "./Node";
import { FormattedNode } from "./FormattedNode";

export class FootnoteNode extends Node<FormattedNode> {

    #footnote: FormattedNode | undefined;

    constructor(parent: FormattedNode, ) {
        super(parent, "footnote");
        
    }

    getFootnote() { return this.#footnote; }

    setFootnote(footnote: FormattedNode) {
        this.#footnote = footnote;
    }

    toText(): string {
        return this.#footnote ? this.#footnote.toText() : "";
    }

    toBookdown(): String {
        return "{" + this.#footnote?.toBookdown() + "}";
    }

    traverseChildren(fn: (node: Node) => void): void {
        this.#footnote?.traverse(fn)
    }

    removeChild(node: Node): void {
        if(this.#footnote === node) this.remove();
    }

    replaceChild(node: FormattedNode, replacement: FormattedNode): void {
        if(this.#footnote === node)
            this.#footnote = replacement;
    }


    getSiblingOf(child: Node, next: boolean) { return undefined; }

    copy(parent: FormattedNode): FootnoteNode {
        const foot = new FootnoteNode(this.getParent() as FormattedNode);
        if(this.#footnote) foot.setFootnote(this.#footnote.copy(foot));
        return foot;
    }

    clean() {}
    
}
