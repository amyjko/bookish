import { Node } from "./Node";
import { BlockParentNode, Position } from "./Parser";
import { FormattedNode } from "./FormattedNode";

export class CodeNode extends Node<BlockParentNode> {

    #code: string;
    #caption: FormattedNode | undefined;
    #position: Position;
    #language: string;
    #executable: boolean;

    constructor(parent: BlockParentNode, code: string, language: string, position: Position) {
        super(parent, "code");

        this.#code = code;
        this.#position = position;
        this.#language = language ? language : "plaintext";
        this.#executable = language.charAt(language.length - 1) === "!";

        if (this.#executable)
            this.#language = this.#language.slice(0, -1);

    }

    getCode() { return this.#code; }
    getCaption() { return this.#caption; }
    getPosition() { return this.#position; }
    getLanguage() { return this.#language; }
    isExecutable() { return this.#executable; }

    setCaption(caption : FormattedNode) {
        this.#caption = caption;
    }

    toText() {
        return "";
    }

    toBookdown(): String {
        // Remember to escape any back ticks.
        return "\n`" + (this.#language !== "plaintext" ? this.#language : "") + "\n" + this.#code.replace(/`/g, '\\`') + "\n`" + (this.#position !== "|" ? this.#position : "") + (this.#caption ? " " + this.#caption.toBookdown() : "");
    }

    traverseChildren(fn: (node: Node) => void): void {
        this.#caption?.traverse(fn)
    }

    removeChild(node: Node): void {}

    replaceChild(node: Node, replacement: Node): void {}

    getSiblingOf(child: Node, next: boolean) { return undefined; }
    
    copy(parent: BlockParentNode): CodeNode {
        const c = new CodeNode(parent, this.#code, this.#language, this.#position);
        if(this.#caption) c.setCaption(this.#caption.copy(c));
        return c;
    }

    clean() {}

}
