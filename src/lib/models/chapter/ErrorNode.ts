import BlockNode from './BlockNode';
import type Node from './Node';

export default class ErrorNode extends BlockNode {
    #text: string | undefined;
    #error: string;
    constructor(text: string | undefined, error: string) {
        super();
        this.#text = text;
        this.#error = error;
    }

    getType() {
        return 'error';
    }
    getError() {
        return this.#error;
    }
    getFormats() {
        return [];
    }

    toText(): string {
        return '';
    }
    toBookdown(): string {
        return this.#text ?? '';
    }
    toHTML() {
        return this.#text ?? '';
    }

    getChildren() {
        return [];
    }
    getParentOf(): Node | undefined {
        return undefined;
    }

    copy() {
        return new ErrorNode(this.#text, this.#error) as this;
    }

    withChildReplaced() {
        return undefined;
    }
    withContentInRange(): this | undefined {
        return this.copy();
    }
}
