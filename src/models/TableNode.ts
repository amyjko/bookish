import { Node } from "./Node";
import { BlockParentNode } from "./BlockParentNode";
import { Position } from "./Position";
import { FormatNode } from "./FormatNode";
import { TextNode } from "./TextNode";

export type Location = { row: number, column: number };

export class TableNode extends Node<BlockParentNode> {

    #rows: FormatNode[][];
    #caption: FormatNode | undefined;
    #position: Position;

    constructor(parent: BlockParentNode, rows: FormatNode[][]) {
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
        this.getChapter()?.changed();
    }

    getCaption() { return this.#caption; }
    setCaption(caption: FormatNode) {
        this.#caption = caption;
    }

    toText() {
        return this.#rows.map(row => row.map(cell => cell.toText()).join(", ")).join(", ");
    }

    toBookdown(debug?: number): string {
        return this.#rows.map(
            row => 
            `,${row.map(cell => cell.toBookdown(debug)).join("|")}`
        ).join("\n") + `\n${this.#position === "|" ? "" : this.#position}${this.#caption ? "" + this.#caption.toBookdown(debug) : ""}`;
    }

    traverseChildren(fn: (node: Node) => void): void {
        this.#rows.forEach(row => row.forEach(cell => cell.traverse(fn)))
        this.#caption?.traverse(fn)
    }

    removeChild(node: Node): void {}

    replaceChild(node: Node, replacement: FormatNode): void {}

    getSiblingOf(child: Node, next: boolean) { return undefined; }

    copy(parent: BlockParentNode): TableNode {
        const rows: FormatNode[][] = [];
        const node = new TableNode(parent, rows);
        if(this.#caption) node.setCaption(this.#caption.copy(node))
        this.#rows.forEach(row => {
            const cells: FormatNode[] = []
            row.forEach(cell => cells.push(cell.copy(node)))
            rows.push(cells)
        })
        return node;

    }

    clean() {}

    locate(format: FormatNode): Location | undefined {

        for(let r = 0; r < this.#rows.length; r++) {
            const row = this.#rows[r];
            for(let c = 0; c < row.length; c++) {
                if(row[c] === format)
                    return { row: r, column: c };
            }
        }
        return undefined;

    }

    getCell(row: number, col: number): FormatNode | undefined {

        return row >= 0 && row < this.#rows.length && this.#rows.length > 0 && col >= 0 && col < this.#rows[0].length ?
            this.#rows[row][col] :
            undefined;

    }

    addRow(index: number) {

        if(index < 0 || index > this.#rows.length)
            throw Error("Invalid table index");

        // Figure out how many columns the first row has, then create a row with that many columns
        // and an empty FormatNode.
        const columnCount = this.#rows.length === 0 ? 0 : this.#rows[0].length;
        const column: FormatNode[] = [];

        for(let c = 0; c < columnCount; c++) {
            const format = new FormatNode(this, "", []);
            format.addSegment(new TextNode(format, ""));
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
            const format = new FormatNode(this, "", []);
            format.addSegment(new TextNode(format, ""));
            this.#rows[r].splice(index, 0, format);
        }

    }

}
