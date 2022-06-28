import { Node } from "./Node";
import { Position } from "./Position";
import { FormatNode } from "./FormatNode";
import { TextNode } from "./TextNode";
import { BlockNode } from "./BlockNode";
import { Caret, CaretRange } from "./Caret";

export class CodeNode extends BlockNode {

    readonly #code: TextNode;
    readonly #caption: FormatNode;
    readonly #position: Position;
    readonly #language: string;
    readonly #executable: boolean;

    constructor(code: TextNode, language: string, position: Position, caption?: FormatNode) {
        super();

        const executable = language.charAt(language.length - 1) === "!";

        this.#code = code;
        this.#position = position;
        this.#language = executable ? language.slice(0, -1) : language;
        this.#executable = executable;
        this.#caption = caption === undefined ? new FormatNode("", [ new TextNode()]) : caption;

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

    toBookdown(debug?: number): string {
        // Remember to escape any back ticks.
        return "`" + 
                (this.#language !== "plaintext" ? this.#language : "") + 
                "\n" + 
                this.#code.getText().replace(/`/g, '\\`') + 
                "\n`" + 
                (this.#position !== "|" ? this.#position : "") + 
                this.#caption.toBookdown(debug);
    }

    getChildren() { return [ this.#code, this.#caption ] }

    copy() {
        return new CodeNode(this.#code.copy(), this.#language, this.#position, this.#caption.copy()) as this;
    }

    getParentOf(node: Node): Node | undefined {
        return node == this.#code || node === this.#caption ? this : this.#caption.getParentOf(node);
    }

    withChildReplaced(node: Node, replacement: Node | undefined) {
        const newCode = node === this.#code && replacement instanceof TextNode ? replacement : undefined;
        const newCaption = node === this.#caption && replacement instanceof FormatNode ? replacement : undefined;
        return newCode || newCaption ? new CodeNode(
            newCode ? newCode : this.#code, 
            this.#language, 
            this.#position, 
            newCaption ? newCaption : this.#caption
        ) as this : undefined;
    }

    withPosition(position: Position) { return new CodeNode(this.#code, this.#language, position, this.#caption); }
    withLanguage(language: string) { return new CodeNode(this.#code, language, this.#position, this.#caption); }
    withExecutable(executable: boolean) { return new CodeNode(this.#code, executable ? this.#language + "!" : this.#language, this.#position, this.#caption); }
    withCaption(caption : FormatNode) { return new CodeNode(this.#code, this.#language, this.#position, caption); }
    
    withContentInRange(range: CaretRange): this | undefined {
        if(!this.contains(range.start.node) && !this.contains(range.end.node)) return this.copy();
        const newCode = this.#caption.contains(range.start.node) ? new TextNode() : this.#code.withContentInRange(range);
        const newCaption = range.end.node === this.#code ? new FormatNode("", [ new TextNode() ] ) : this.#caption.withContentInRange(range);
        if(newCode === undefined || newCaption === undefined) return;
        return new CodeNode(newCode, this.#language, this.#position, newCaption) as this;
    }

}