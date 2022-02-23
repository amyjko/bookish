import { Node } from "./Node";
import { FormattedNode } from "./FormattedNode";

export class LinkNode extends Node<FormattedNode> {

    #text: string;
    #url: string;
    
    constructor(parent: FormattedNode, text: string = "", url: string = "") {
        super(parent, "link");
        this.#text = text;
        this.#url = url;
    }

    getURL() { return this.#url }
    getText() { return this.#text; }

    setText(text: string) {
        this.#text = text;
    }

    setURL(url: string) {
        this.#url = url;
    }

    toText(): string {
        return this.#text ? this.#text : "";
    }

    toBookdown(): String {
        return `[${this.#text}|${this.#url}]`
    }

    traverseChildren(fn: (node: Node) => void): void {}

    removeChild(node: Node): void {}

    replaceChild(node: Node, replacement: Node): void {}
    
    getSiblingOf(child: Node, next: boolean) { return undefined; }

    copy(parent: FormattedNode): LinkNode {
        return new LinkNode(parent, this.#text, this.#url);
    }

    clean() {}

}
