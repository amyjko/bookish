import { Node } from "./Node";

export class ErrorNode extends Node {
    #text: string | undefined;
    #error: string;
    constructor(parent: Node | undefined, text: string | undefined, error: string) {
        super(parent, "error");
        this.#text = text;
        this.#error = error;
    }

    getError() { return this.#error; }

    toText(): string {
        return "";
    }

    toBookdown(debug?: number): string { return this.#text ? this.#text : ""; }

    traverseChildren(fn: (node: Node) => void): void {}

    removeChild(node: Node): void {}

    replaceChild(node: Node, replacement: Node): void {}

    getSiblingOf(child: Node, next: boolean) { return undefined; }

    copy(parent: Node): ErrorNode {
        return new ErrorNode(parent, this.#text, this.#error);
    }

    clean() {}

}
