import { BlockNode } from "./BlockNode";
import { Node } from "./Node";

export class ErrorNode extends BlockNode {
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
    toBookdown(): string { return this.#text ? this.#text : ""; }

    getChildren() { return []; }
    getParentOf(node: Node): Node | undefined { return undefined; }

    copy() { return new ErrorNode(this.#text, this.#error) as this; }

    withChildReplaced(){ return undefined; }
    withContentInRange(): this | undefined { return this.copy(); }

}
