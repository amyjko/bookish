import { Node } from "./Node";
import { BlockParentNode } from "./BlockParentNode";
import { Position } from "./Position";
import { FormatNode } from "./FormatNode";
import { TextNode } from "./TextNode";

export class CodeNode extends Node<BlockParentNode> {

    #code: TextNode;
    #caption: FormatNode;
    #position: Position;
    #language: string;
    #executable: boolean;

    constructor(parent: BlockParentNode, code: string, language: string, position: Position) {
        super(parent, "code");

        this.#code = new TextNode(this, code);
        this.#position = position;
        this.#language = language ? language : "plaintext";
        this.#executable = language.charAt(language.length - 1) === "!";

        if (this.#executable)
            this.#language = this.#language.slice(0, -1);

        this.#caption = new FormatNode(this, "", []);
        this.#caption.addSegment(new TextNode(this.#caption, ""));    

    }

    getCodeNode() { return this.#code; }
    getCode() { return this.#code.getText(); }
    getCaption() { return this.#caption; }
    getPosition() { return this.#position; }
    setPosition(position: Position) { this.#position = position; }
    getLanguage() { return this.#language; }
    setLanguage(language: string) { this.#language = language; }
    isExecutable() { return this.#executable; }
    setExecutable(executable: boolean) { this.#executable = executable; }

    setCaption(caption : FormatNode) {
        this.#caption = caption;
    }

    toText() {
        return "";
    }

    toBookdown(): String {
        // Remember to escape any back ticks.
        return "\n`" + (this.#language !== "plaintext" ? this.#language : "") + "\n" + this.#code.getText().replace(/`/g, '\\`') + "\n`" + (this.#position !== "|" ? this.#position : "") + this.#caption.toBookdown();
    }

    traverseChildren(fn: (node: Node) => void): void {
        this.#code.traverse(fn);
        this.#caption.traverse(fn);
    }

    removeChild(node: Node): void {}

    replaceChild(node: Node, replacement: Node): void {}

    getSiblingOf(child: Node, next: boolean) { return undefined; }
    
    copy(parent: BlockParentNode): CodeNode {
        const c = new CodeNode(parent, this.#code.getText(), this.#language, this.#position);
        c.setCaption(this.#caption.copy(c));
        return c;
    }

    clean() {}

}
