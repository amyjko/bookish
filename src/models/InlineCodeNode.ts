import { Caret } from "./ChapterNode";
import { FormattedNode } from "./FormattedNode";
import { Node } from "./Node";
import { TextNode } from "./TextNode";

export class InlineCodeNode extends Node<FormattedNode> {

    #code: TextNode;
    #language: string;

    constructor(parent: FormattedNode, code: string = "", language: string = "plaintext") {
        super(parent, "inline-code");
        this.#code = new TextNode(this, code, 0);
        this.#language = language;
    }

    getTextNode() { return this.#code; }
    getCode() { return this.#code.getText(); }
    getLanguage() { return this.#language; }
    setLanguage(lang: string) { return this.#language = lang; }

    toText(): string {
        return this.#code.getText();
    }

    toBookdown(): String {
        return "`" + this.#code.getText().replace(/`/g, '\\`') + "`" + (this.#language === "plaintext" ? "" : this.#language);
    }

    traverseChildren(fn: (node: Node) => void): void { this.#code.traverse(fn); }

    removeChild(node: Node): void {
        if(node === this.#code)
            this.remove();
    }

    replaceChild(node: Node, replacement: Node): void {}

    getSiblingOf(child: Node, next: boolean) { return undefined; }

    copy(parent: FormattedNode): InlineCodeNode {
        return new InlineCodeNode(parent, this.#code.getText(), this.#language)
    }

    clean() {
        if(this.#code.getLength() === 0) this.remove();
    }

    unformat(): Caret | undefined {
        const parent = this.getParent();
        if(parent === undefined)
            return undefined;
        // Remember the text position of the text.
        const index = parent.caretToTextIndex({ node: this.#code, index: 0});
        // Replace this with it's text node.
        this.getParent()?.replaceChild(this, this.#code);
        // Return the corresponding caret position.
        return parent.textIndexToCaret(index);
    }

}
