import BlocksNode from './BlocksNode';
import type BlockNode from './BlockNode';
import type Position from './Position';

export default class CalloutNode extends BlocksNode {
    readonly #position: Position;

    constructor(elements: BlockNode[], position: Position = '|') {
        super(elements);
        this.#position = position;
    }

    getType() {
        return 'callout';
    }

    getPosition() {
        return this.#position;
    }

    toText(): string {
        return this.getBlocks()
            .map((element) => element.toText())
            .join(' ');
    }

    toHTML(): string {
        return `<hr/>${super.toHTML()}<hr/>`;
    }

    toBookdown(): string {
        return (
            '=\n' +
            this.getBlocks()
                .map((element) => element.toBookdown())
                .join('\n\n') +
            '\n=' +
            (this.#position !== '|' ? this.#position : '')
        );
    }

    getChildren() {
        return this.getBlocks();
    }

    copy() {
        return new CalloutNode(
            this.getBlocks().map((e) => e.copy()),
            this.#position
        ) as this;
    }

    withPosition(position: Position): CalloutNode {
        return new CalloutNode(this.getBlocks(), position);
    }

    withChildReplaced(node: BlockNode, replacement: BlockNode | undefined) {
        const index = this.getBlocks().indexOf(node);
        if (index < 0) return;

        const blocks =
            replacement === undefined
                ? [
                      ...this.getBlocks().slice(0, index),
                      ...this.getBlocks().slice(index + 1),
                  ]
                : [
                      ...this.getBlocks().slice(0, index),
                      replacement,
                      ...this.getBlocks().slice(index + 1),
                  ];

        return new CalloutNode(blocks, this.#position) as this;
    }

    create(blocks: BlockNode[]): CalloutNode {
        return new CalloutNode(blocks, this.#position);
    }
}
