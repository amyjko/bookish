import { Node } from "./Node";
import { BlockParentNode } from "./BlockParentNode";
import { Position } from "./Position";
import { FormatNode } from "./FormatNode";
import { TextNode } from "./TextNode";
import { BlockNode } from "./BlockNode";

export class CodeNode extends BlockNode<BlockParentNode> {

    readonly #code: TextNode;
    readonly #caption: FormatNode;
    readonly #position: Position;
    readonly #language: string;
    readonly #executable: boolean;

    constructor(code: string, language: string, position: Position, caption?: FormatNode) {
        super();

        const executable = language.charAt(language.length - 1) === "!";

        this.#code = new TextNode(code);
        this.#position = position;
        this.#language = executable ? language.slice(0, -1) : language;
        this.#executable = executable;
        this.#caption = caption === undefined ? new FormatNode("", [ new TextNode("")]) : caption;

    }

    getType() { return "code"; }

    getCodeNode() { return this.#code; }
    getCode() { return this.#code.getText(); }
    getCaption() { return this.#caption; }
    getPosition() { return this.#position; }
    getLanguage() { return this.#language; }
    isExecutable() { return this.#executable; }
    getFormats() { return [ this.#caption ]; }

    toText() { return ""; }

    toBookdown(parent: BlockParentNode, debug?: number): string {
        // Remember to escape any back ticks.
        return "\n`" + (this.#language !== "plaintext" ? this.#language : "") + "\n" + this.#code.getText().replace(/`/g, '\\`') + "\n`" + (this.#position !== "|" ? this.#position : "") + this.#caption.toBookdown(this, debug);
    }

    traverseChildren(fn: (node: Node) => void): void {
        this.#code.traverse(fn);
        this.#caption.traverse(fn);
    }

    copy(): CodeNode {
        return new CodeNode(this.#code.getText(), this.#language, this.#position, this.#caption.copy());
    }

    getParentOf(node: Node): Node | undefined {
        return node == this.#code || node === this.#caption ? this : this.#caption.getParentOf(node);
    }

    withChildReplaced(node: Node, replacement: Node | undefined): CodeNode | undefined {
        const newCode = node === this.#code && replacement instanceof TextNode ? replacement : undefined;
        const newCaption = node === this.#caption && replacement instanceof FormatNode ? replacement : undefined;
        return newCode || newCaption ? new CodeNode(
            newCode ? newCode.getText() : this.#code.getText(), 
            this.#language, 
            this.#position, 
            newCaption ? newCaption : this.#caption
        ) : undefined;
    }

    withPosition(position: Position) { return new CodeNode(this.#code.getText(), this.#language, position, this.#caption); }
    withLanguage(language: string) { return new CodeNode(this.#code.getText(), language, this.#position, this.#caption); }
    withExecutable(executable: boolean) { return new CodeNode(this.#code.getText(), executable ? this.#language + "!" : this.#language, this.#position, this.#caption); }
    withCaption(caption : FormatNode) { return new CodeNode(this.#code.getText(), this.#language, this.#position, caption); }

}
