import { BlockNode } from "./BlockNode";
import { Node } from "./Node";

export class ErrorNode extends BlockNode<Node | undefined> {
    #text: string | undefined;
    #error: string;
    constructor(text: string | undefined, error: string) {
        super();
        this.#text = text;
        this.#error = error;
    }

    getType() { return "error"; }
    getError() { return this.#error; }
    getFormats() { return []; }

    toText(): string { return ""; }
    toBookdown(parent: Node, debug?: number): string { return this.#text ? this.#text : ""; }

    traverseChildren(fn: (node: Node) => void): void {}
    getParentOf(node: Node): Node | undefined { return undefined; }

    copy(): ErrorNode { return new ErrorNode(this.#text, this.#error); }

    withChildReplaced(node: Node, replacement: Node | undefined){ return undefined; }

}
