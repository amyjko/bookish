import { Node } from "./Node";
import { BlockParentNode } from "./BlockParentNode";
import { Position } from "./Position";
import { FormattedNode } from "./FormattedNode";
import { TextNode } from "./TextNode";

export type Location = { row: number, column: number };

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

    getRowCount() { return this.#rows.length; }

    getColumnCount() { return this.#rows.length === 0 ? 0 : this.#rows[0].length; }

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

    locate(format: FormattedNode): Location | undefined {

        for(let r = 0; r < this.#rows.length; r++) {
            const row = this.#rows[r];
            for(let c = 0; c < row.length; c++) {
                if(row[c] === format)
                    return { row: r, column: c };
            }
        }
        return undefined;

    }

    getCell(row: number, col: number): FormattedNode | undefined {

        return row >= 0 && row < this.#rows.length && this.#rows.length > 0 && col >= 0 && col < this.#rows[0].length ?
            this.#rows[row][col] :
            undefined;

    }

    addRow(index: number) {

        if(index < 0 || index > this.#rows.length)
            throw Error("Invalid table index");

        // Figure out how many columns the first row has, then create a row with that many columns
        // and an empty FormattedNode.
        const columnCount = this.#rows.length === 0 ? 0 : this.#rows[0].length;
        const column: FormattedNode[] = [];

        for(let c = 0; c < columnCount; c++) {
            const format = new FormattedNode(this, "", []);
            format.addSegment(new TextNode(format, "", 0));
            column.push(format);
        }

        this.#rows.splice(index, 0, column);

    }

    deleteRow(index: number) {

        if(index < 0 || index >= this.#rows.length)
            return;

        this.#rows.splice(index, 1);

    }

    deleteColumn(index: number) {

        if(index < 0 || index >= this.getColumnCount())
            return;

        for(let r = 0; r < this.#rows.length; r++)
            this.#rows[r].splice(index, 1);

    }

    addColumn(index: number) {

        if(this.#rows.length > 0 && (index < 0 || index > this.#rows[0].length))
            throw Error("Invalid table index");

        // Figure out how many rows the table has and add a column 
        for(let r = 0; r < this.#rows.length; r++) {
            const format = new FormattedNode(this, "", []);
            format.addSegment(new TextNode(format, "", 0));
            this.#rows[r].splice(index, 0, format);
        }

    }

}
