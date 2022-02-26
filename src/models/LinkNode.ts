import { Node } from "./Node";
import { FormattedNode } from "./FormattedNode";
import { TextNode } from "./TextNode";
import { Caret } from "./ChapterNode";

export class LinkNode extends Node<FormattedNode> {

    #text: TextNode;
    #url: string;
    
    constructor(parent: FormattedNode, text: string = "", url: string = "") {
        super(parent, "link");
        this.#text = new TextNode(this, text, 0);
        this.#url = url;
    }

    getURL() { return this.#url }
    getText() { return this.#text; }

    setURL(url: string) {
        this.#url = url;
    }

    toText(): string {
        return this.#text ? this.#text.toText() : "";
    }

    toBookdown(): String {
        return `[${this.#text.toText()}|${this.#url}]`;
    }

    traverseChildren(fn: (node: Node) => void): void { this.#text.traverse(fn); }

    removeChild(node: Node): void {
        if(node === this.#text)
            this.remove();
    }

    replaceChild(node: Node, replacement: Node): void {}
    
    getSiblingOf(child: Node, next: boolean) { return undefined; }

    unlink(): Caret | undefined {
        const parent = this.getParent();
        if(parent === undefined)
            return undefined;
        // Remember the text position of the text.
        const index = parent.caretToTextIndex({ node: this.#text, index: 0});
        // Replace this with it's text node.
        this.getParent()?.replaceChild(this, this.#text);
        // Return the corresponding caret position.
        return parent.textIndexToCaret(index);
    }

    copy(parent: FormattedNode): LinkNode {
        return new LinkNode(parent, this.#text.getText(), this.#url);
    }

    clean() {
        if(this.#text.getLength() === 0)
            this.remove();
    }

}
