import { Node } from "./Node";
import { Position } from "./Position";
import { FormatNode } from "./FormatNode";
import { TextNode } from "./TextNode";
import { BlockNode } from "./BlockNode";

export type Location = { row: number, column: number };

export class TableNode extends BlockNode {

    readonly #rows: FormatNode[][];
    readonly #caption: FormatNode | undefined;
    readonly #position: Position;

    constructor(rows: FormatNode[][], position?: Position, caption?: FormatNode) {
        super();
        this.#rows = rows;
        this.#position = position ? position : "|";
        this.#caption = caption;
    }

    getType() { return "table"; }

    getRows() { return this.#rows; }
    getRowCount() { return this.#rows.length; }
    getColumnCount() { return this.#rows.length === 0 ? 0 : this.#rows[0].length; }
    getPosition() { return this.#position; }
    getCaption() { return this.#caption; }
    getFormats() { 
        const formats: FormatNode[] = [];
        this.#rows.forEach(row => row.forEach(cell => { formats.push(cell); }))
        return this.#caption ? [ this.#caption, ...formats ] : formats;
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

    getParentOf(node: Node): Node | undefined {
        for(let r = 0; r < this.#rows.length; r++) {
            const row = this.#rows[r];
            for(let c = 0; c < row.length; c++) {
                if(row[c] === node)
                    return this;
                const parent = row[c].getParentOf(node);
                if(parent !== undefined)
                    return parent;
            }
        }
    }

    withChildReplaced(node: Node, replacement: Node | undefined) {

        // If it's just the caption, make a new node with the new credit.
        if(node === this.#caption && replacement instanceof FormatNode)
            return new TableNode(this.#rows, this.#position, replacement);

        // If it's a cell, update the cell.
        if(node instanceof FormatNode && replacement instanceof FormatNode) {

            // Does this table contain node we're replacing?
            let updateRow = 0;
            let updateColumn = -1;
            for(let i = 0; i < this.#rows.length; i++) {
                updateColumn = this.#rows[i].indexOf(node);
                if(updateColumn >= 0) break;
            }

            // Make new rows with the updated cell.
            if(updateRow < this.#rows.length && updateColumn >= 0) {
                const newRows = this.#rows.map(row => [ ... row ]);
                newRows[updateRow][updateColumn] = replacement;
                return new TableNode(newRows, this.#position, this.#caption)
            }
        }

    }


    copy(): TableNode {
        const rows: FormatNode[][] = [];
        this.#rows.forEach(row => {
            const cells: FormatNode[] = []
            row.forEach(cell => cells.push(cell.copy()))
            rows.push(cells)
        })
        return new TableNode(rows, this.#position, this.#caption ? this.#caption.copy() : undefined);

    }

    withRowInserted(index: number): TableNode | undefined {

        if(index < 0 || index > this.#rows.length) return;

        // Figure out how many columns the first row has, then create a row with that many columns
        // and an empty FormatNode.
        const columnCount = this.#rows.length === 0 ? 0 : this.#rows[0].length;
        const column: FormatNode[] = [];

        for(let c = 0; c < columnCount; c++)
            column.push(new FormatNode("", [ new TextNode("") ]));

        return new TableNode(this.#rows.slice().splice(index, 0, column), this.#position, this.#caption);

    }

    withRowDeleted(index: number): TableNode | undefined {

        if(index < 0 || index >= this.#rows.length)
            return;

        return new TableNode(this.#rows.slice().splice(index, 1), this.#position, this.#caption);

    }

    withColumnDeleted(index: number): TableNode | undefined {

        if(index < 0 || index >= this.getColumnCount())
            return;

        const newRows = this.#rows.slice();
        for(let r = 0; r < this.#rows.length; r++)
            newRows[r].splice(index, 1);

        return new TableNode(newRows, this.#position, this.#caption);

    }

    withColumnInserted(index: number): TableNode | undefined {

        if(this.#rows.length > 0 && (index < 0 || index > this.#rows[0].length)) return;

        // Figure out how many rows the table has and add a column 
        const newRows = this.#rows.slice();
        for(let r = 0; r < this.#rows.length; r++)
            newRows[r].splice(index, 0, new FormatNode("", [ new TextNode("") ]));
        return new TableNode(newRows, this.#position, this.#caption);

    }

}