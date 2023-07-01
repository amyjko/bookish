import type { CaretRange } from './Caret';
import Node from './Node';
import { LINE_BREAK } from './Symbols';

export default class LineBreakNode extends Node {
    constructor() {
        super();
    }

    getType() {
        return 'linebreak';
    }
    getParentOf(): Node | undefined {
        return undefined;
    }

    toText(): string {
        return LINE_BREAK;
    }

    toBookdown(): string {
        return LINE_BREAK;
    }

    getCaretPositionCount() {
        return 1;
    }

    toHTML() {
        return '<br/>';
    }

    getChildren() {
        return [];
    }

    copy() {
        return new LineBreakNode() as this;
    }

    withChildReplaced(): this | undefined {
        return this;
    }
    withContentInRange(range: CaretRange): this | undefined {
        return this;
    }
}
