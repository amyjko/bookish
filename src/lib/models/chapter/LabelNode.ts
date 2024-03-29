import AtomNode from './AtomNode';
import type Caret from './Caret';
import type FormatNode from './FormatNode';
import type Node from './Node';

const ERROR_PLACEHOLDER = 'LABELNOIDERROR';

export default class LabelNode extends AtomNode<string> {
    constructor(newID: string) {
        super(newID === ERROR_PLACEHOLDER ? '' : newID);
    }

    getType() {
        return 'label';
    }

    getDefaultCaret(): Caret {
        return { node: this, index: 0 };
    }

    toText(): string {
        return '';
    }
    toHTML() {
        return '';
    }

    toBookdown(format?: FormatNode): string {
        const id = this.getMeta();
        const nextText = format?.getNextTextOrAtom(this)?.toBookdown();

        // The trailing space after enables parsing. The error placeholder handles invalid empty label IDs.
        return `:${id === '' ? ERROR_PLACEHOLDER : id}${
            nextText?.startsWith(' ') ? '' : ' '
        }`;
    }

    getParentOf(): Node | undefined {
        return undefined;
    }

    copy() {
        return new LabelNode(this.getMeta()) as this;
    }

    withMeta(newID: string) {
        return new LabelNode(newID);
    }
    withChildReplaced() {
        return undefined;
    }

    withContentInRange(): this | undefined {
        return this.copy();
    }
}
