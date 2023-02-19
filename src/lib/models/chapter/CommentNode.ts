import AtomNode from './AtomNode';
import type Caret from './Caret';
import type { CaretRange } from './Caret';
import FormatNode from './FormatNode';
import type Node from './Node';
import TextNode from './TextNode';

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
        const text = format
            ?.getTextAndAtomNodes()
            .filter((child) => child === this || !this.contains(child));
        let previousText;
        if (text) {
            const index = text.indexOf(this);
            const previous = text[index - 1];
            previousText = previous instanceof TextNode ? previous : undefined;
        }
        return `${
            previousText !== undefined && !previousText.getText().endsWith(' ')
                ? ' '
                : ''
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
