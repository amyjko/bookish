import { CaretPosition } from "./ChapterNode";
import { ContentNode } from "./ContentNode";
import { Node } from "./Node";


export class InlineCodeNode extends Node {
    code: string;
    language: string;

    constructor(parent: ContentNode, code: string, language: string) {
        super(parent, "inline-code");
        this.code = code;
        this.language = language;
    }

    toText(): string {
        return this.code;
    }

    toBookdown(): String {
        return "`" + this.code.replace(/`/g, '\\`') + "`" + (this.language === "plaintext" ? "" : this.language);
    }

    traverseChildren(fn: (node: Node) => void): void {}

    removeChild(node: Node): void {}

    replaceChild(node: Node, replacement: Node): void {}

    getSiblingOf(child: Node, next: boolean) { return undefined; }

    copy(parent: ContentNode): InlineCodeNode {
        return new InlineCodeNode(parent, this.code, this.language)
    }

    deleteBackward(index: number | Node | undefined): CaretPosition | undefined {
        throw Error("InlineCodeNode doesn't know how to backspace.")
    }

    deleteRange(start: number, end: number): CaretPosition {
        throw new Error("InlineCode deleteRange not implemented.");
    }
    
    deleteForward(index: number | Node | undefined): CaretPosition | undefined {
        throw new Error("InlineCode deleteForward not implemented.");
    }

    clean() {
        if(this.code.length === 0) this.remove();
    }

}
