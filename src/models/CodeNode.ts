import { CaretPosition, ChapterNode } from "./ChapterNode";
import { Node } from "./Node";
import { Position } from "./Parser";
import { ContentNode } from "./ContentNode";
import { CalloutNode } from "./CalloutNode";
import { QuoteNode } from "./QuoteNode";

export class CodeNode extends Node {
    code: string;
    caption: ContentNode | undefined;
    position: Position;
    language: string;
    executable: boolean;
    constructor(parent: ChapterNode | CalloutNode | QuoteNode, code: string, language: string, position: Position) {
        super(parent, "code");

        this.code = code;
        this.position = position;
        this.language = language ? language : "plaintext";
        this.executable = language.charAt(language.length - 1) === "!";

        if (this.executable)
            this.language = this.language.slice(0, -1);

    }

    setCaption(caption : ContentNode) {
        this.caption = caption;
    }

    toText() {
        return "";
    }

    toBookdown(): String {
        // Remember to escape any back ticks.
        return "\n`" + (this.language !== "plaintext" ? this.language : "") + "\n" + this.code.replace(/`/g, '\\`') + "\n`" + (this.position !== "|" ? this.position : "") + (this.caption ? " " + this.caption.toBookdown() : "");
    }

    traverseChildren(fn: (node: Node) => void): void {
        this.caption?.traverse(fn)
    }

    removeChild(node: Node): void {}
    getSiblingOf(child: Node, next: boolean) { return undefined; }
    
    copy(parent: ChapterNode | CalloutNode | QuoteNode): CodeNode {
        const c = new CodeNode(parent, this.code, this.language, this.position);
        if(this.caption) c.setCaption(this.caption.copy(c));
        return c;
    }

    deleteBackward(index: number | Node | undefined): CaretPosition | undefined {
        throw Error("CodeNode doesn't know how to backspace.")
    }

    deleteRange(start: number, end: number): CaretPosition {
        throw new Error("Code deleteRange not implemented.");
    }
    
    deleteForward(index: number | Node | undefined): CaretPosition | undefined {
        throw new Error("Code deleteForward not implemented.");
    }

    clean() {}

}
