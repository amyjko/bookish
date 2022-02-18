import { FormattedNode } from "./FormattedNode";
import { Node } from "./Node";

export class InlineCodeNode extends Node {
    code: string;
    language: string;

    constructor(parent: FormattedNode, code: string, language: string) {
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

    copy(parent: FormattedNode): InlineCodeNode {
        return new InlineCodeNode(parent, this.code, this.language)
    }

    clean() {
        if(this.code.length === 0) this.remove();
    }

}
