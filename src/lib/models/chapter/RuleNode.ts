import type Node from './Node';
import BlockNode from './BlockNode';

export default class RuleNode extends BlockNode {
    constructor() {
        super();
    }

    getType() {
        return 'rule';
    }
    toText(): string {
        return '';
    }
    toBookdown(): string {
        return '-';
    }
    toHTML() {
        return `<hr/>`;
    }
    getParentOf(): Node | undefined {
        return undefined;
    }
    getFormats() {
        return [];
    }
    getChildren(): Node[] {
        return [];
    }
    copy() {
        return new RuleNode() as this;
    }
    withChildReplaced() {
        return undefined;
    }
    withContentInRange(): this | undefined {
        return this.copy();
    }
}
