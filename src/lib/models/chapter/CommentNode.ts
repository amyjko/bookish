import AtomNode from './AtomNode';
import type Caret from './Caret';
import type { CaretRange } from './Caret';
import FormatNode from './FormatNode';
import type Node from './Node';

export default class CommentNode extends AtomNode<FormatNode> {
    constructor(comment: FormatNode) {
        super(comment.withTextIfEmpty());
    }

    getType() {
        return 'comment';
    }
    toText(): string {
        return '';
    }
    toHTML(): string {
        return `(${this.getMeta().toHTML()})`;
    }

    getDefaultCaret(): Caret | undefined {
        return this.getMeta().getFirstCaret();
    }

    toBookdown(format?: FormatNode): string {
        const previousText = format?.getPreviousTextOrAtom(this)?.toBookdown();
        // Insert a space before the % if there isn't one before this.
        return `${
            previousText?.endsWith(' ') ? '' : ' '
        }%${this.getMeta().toBookdown()}%`;
    }

    copy() {
        return new CommentNode(this.getMeta().copy()) as this;
    }

    withChildReplaced(node: Node, replacement: Node | undefined) {
        return node instanceof FormatNode &&
            replacement instanceof FormatNode &&
            node === this.getMeta()
            ? (new CommentNode(replacement) as this)
            : undefined;
    }

    getParentOf(node: Node): Node | undefined {
        return node === this.getMeta()
            ? this
            : this.getMeta().getParentOf(node);
    }

    withMeta(comment: FormatNode) {
        return new CommentNode(comment);
    }

    withContentInRange(range: CaretRange): this | undefined {
        const newFormat = this.getMeta().withContentInRange(range);
        if (newFormat === undefined) return;
        return this.withMeta(newFormat) as this;
    }
}
