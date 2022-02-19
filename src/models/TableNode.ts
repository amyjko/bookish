import { Node } from "./Node";
import { BlockParentNode, Position } from "./Parser";
import { FormattedNode } from "./FormattedNode";

export class TableNode extends Node<BlockParentNode> {

    #rows: FormattedNode[][];
    #caption: FormattedNode | undefined;
    #position: Position;

    constructor(parent: BlockParentNode, rows: FormattedNode[][]) {
        super(parent, "table");
        this.#rows = rows;
        this.#position = "|";
    }

    getRows() { return this.#rows; }

    getPosition() { return this.#position; }
    setPosition(position: Position) {
        this.#position = position;
    }

    getCaption() { return this.#caption; }
    setCaption(caption: FormattedNode) {
        this.#caption = caption;
    }

    toText() {
        return this.#rows.map(row => row.map(cell => cell.toText()).join(", ")).join(", ");
    }

    toBookdown(): String {
        return this.#rows.map(row => `\n,${row.map(cell => cell.toBookdown()).join("|")}`) + 
            `\n${this.#position === "|" ? "" : this.#position}${this.#caption ? "" + this.#caption.toBookdown() : ""}`;
    }

    traverseChildren(fn: (node: Node) => void): void {
        this.#rows.forEach(row => row.forEach(cell => cell.traverse(fn)))
        this.#caption?.traverse(fn)
    }

    removeChild(node: Node): void {}

    replaceChild(node: Node, replacement: FormattedNode): void {}

    getSiblingOf(child: Node, next: boolean) { return undefined; }

    copy(parent: BlockParentNode): TableNode {
        const rows: FormattedNode[][] = [];
        const node = new TableNode(parent, rows);
        if(this.#caption) node.setCaption(this.#caption.copy(node))
        this.#rows.forEach(row => {
            const cells: FormattedNode[] = []
            row.forEach(cell => cells.push(cell.copy(node)))
            rows.push(cells)
        })
        return node;

    }

    clean() {}

}
