import type Node from "./Node";
import type Position from "./Position";
import FormatNode, { type Format } from "./FormatNode";
import TextNode from "./TextNode";
import BlockNode from "./BlockNode";
import type { CaretRange } from "./Caret";
import type Edit from "./Edit";
import type Caret from "./Caret";

export default class CodeNode extends BlockNode {

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
        this.#caption = caption === undefined ? new FormatNode("", [ new TextNode()]) : caption.withTextIfEmpty();

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
    toHTML(): string { return `<pre><code>${this.#code.toHTML()}</code><pre><center>${this.#caption.toHTML()}</center>`; }

    toBookdown(): string {
        // Remember to escape any back ticks.
        return "`" + 
                (this.#language !== "plaintext" ? this.#language : "") + (this.#executable ? "!" : "") +
                "\n" + 
                this.#code.getText().replace(/`/g, '\\`') + 
                "\n`" + 
                (this.#position !== "|" ? this.#position : "") + 
                this.#caption.toBookdown();
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
        const newCaption = node === this.#caption && (replacement instanceof FormatNode || replacement === undefined) ? replacement : undefined;
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

    /** Overrides super, special casing TextNode, since super only handles formats. */
    withRangeFormatted(range: CaretRange, format: Format | undefined): Edit {

        let editedNode: Node | undefined = this;

        // First, handle the caption, if necessary.
        let captionEdit = super.withRangeFormatted(range, format);

        // If we're asking for format, skip it, code can't be formatted. Just return the caption edit.
        if(format !== undefined) return captionEdit;

        // Grab the new CodeNode if the caption was edited.
        if(captionEdit)
            editedNode = captionEdit.root as this;

        // Next, see if part of the range included this text node.
        const sortedRange = this.sortRange(range);
        const containsStart = sortedRange.start.node === this.#code;
        const containsEnd = sortedRange.end.node === this.#code;
        if(containsStart) {

            const revisedCode = this.#code.withoutRange({ 
                start: { node: this.#code, index: sortedRange.start.index }, 
                end: { node: this.#code, index: containsEnd ? sortedRange.end.index : this.#code.getLength()} }
            );
            if(revisedCode === undefined) return;
            editedNode = editedNode.withChildReplaced(this.#code, revisedCode);
            if(editedNode === undefined) return;
            const revisedCaret = { node: revisedCode, index: sortedRange.start.index };            
            return { root: editedNode, range: { start: revisedCaret, end: revisedCaret } };
        }
        else {
            return captionEdit;
        }

    }

    withNodeInserted(caret: Caret, node: Node): Edit {

        // Only insert if the caret is in the code node.
        if(caret.node !== this.#code) return undefined;

        // Convert the node to text, then insert it at the position.
        const text = node
            .getNodes()
            .filter((n): n is TextNode => n instanceof TextNode)
            .map(t => t.getText())
            .join("");

        const newCode = this.#code.withCharacterAt(text, caret.index);
        if(newCode === undefined) return undefined;
        const newNode = this.withChildReplaced(this.#code, newCode);
        if(newNode === undefined) return;
        const newCaret = { node: newCode, index: caret.index + text.length };
        return { root: newNode, range: { start: newCaret, end: newCaret }};

    }

}