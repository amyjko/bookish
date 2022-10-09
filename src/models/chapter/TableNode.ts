import { Node } from "./Node";
import { Position } from "./Position";
import { FormatNode } from "./FormatNode";
import { TextNode } from "./TextNode";
import { BlockNode } from "./BlockNode";
import { CaretRange } from "./Caret";

type Location = { row: number, column: number };

export class TableNode extends BlockNode {

    readonly #rows: FormatNode[][];
    readonly #caption: FormatNode;
    readonly #position: Position;

    constructor(rows: FormatNode[][], position?: Position, caption?: FormatNode) {
        super();
        this.#rows = rows.map(r => r.map(c => c.withTextIfEmpty()));
        this.#position = position ? position : "|";
        this.#caption = caption === undefined ? new FormatNode("", [ new TextNode() ]) : caption.withTextIfEmpty();
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
        return [ ...formats, this.#caption ];
    }

    toText() {
        return this.#rows.map(row => row.map(cell => cell.toText()).join(", ")).join(", ");
    }

    toBookdown(): string {
        return this.#rows.map(row => `,${row.map(cell => cell.toBookdown()).join("|")}`).join("\n") + 
            `\n${this.#position === "|" ? "" : this.#position}${this.#caption ? "" + this.#caption.toBookdown() : ""}`;
    }

    toHTML() { 
        return `<table><tbody>${this.#rows.map(row => `<tr>${row.map(cell => `<td>${cell.toHTML()}</td>`).join("")}`).join("")}</tbody></table><center>${this.#caption.toHTML()}</center>`;
    }

    getChildren() {
        const children = [];
        this.#rows.forEach(row => row.forEach(cell => children.push(cell)));
        children.push(this.#caption);
        return children;
    }

    locate(format: FormatNode): Location | undefined {

        for(let r = 0; r < this.#rows.length; r++) {
            const row = this.#rows[r];
            for(let c = 0; c < row.length; c++) {
                if(row[c] === format)
                    return { row: r, column: c };
            }
        }

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
        return node === this.#caption ? this: this.#caption.getParentOf(node);
    }

    copy() {
        const rows: FormatNode[][] = [];
        this.#rows.forEach(row => {
            const cells: FormatNode[] = []
            row.forEach(cell => cells.push(cell.copy()))
            rows.push(cells)
        })
        return new TableNode(rows, this.#position, this.#caption ? this.#caption.copy() : undefined) as this;

    }

    withChildReplaced(node: FormatNode, replacement: FormatNode | undefined) {

        // If it's just the caption, make a new node with the new credit.
        if(node === this.#caption && (replacement instanceof FormatNode || replacement === undefined))
            return new TableNode(this.#rows, this.#position, replacement) as this;

        // If it's a cell, update the cell.
        if(node instanceof FormatNode && replacement instanceof FormatNode) {

            // Does this table contain node we're replacing?
            let updateRow = 0;
            let updateColumn = -1;
            for(; updateRow < this.#rows.length; updateRow++) {
                updateColumn = this.#rows[updateRow].indexOf(node);
                if(updateColumn >= 0) break;
            }

            // Make new rows with the updated cell.
            if(updateRow < this.#rows.length && updateColumn >= 0) {
                const newRows = this.#rows.map(row => [ ... row ]);
                newRows[updateRow][updateColumn] = replacement;
                return new TableNode(newRows, this.#position, this.#caption) as this;
            }
        }

    }

    withNewRow(index: number): TableNode | undefined {

        if(index < 0 || index > this.#rows.length) return;

        // Figure out how many columns the first row has, then create a row with that many columns
        // and an empty FormatNode.
        const columnCount = this.#rows.length === 0 ? 0 : this.#rows[0].length;
        const column: FormatNode[] = [];

        for(let c = 0; c < columnCount; c++)
            column.push(new FormatNode("", [ new TextNode() ]));

        const newRows = this.#rows.slice();
        newRows.splice(index, 0, column)
        return new TableNode(newRows, this.#position, this.#caption);

    }

    withoutRow(index: number): TableNode | undefined {

        if(index < 0 || index >= this.#rows.length) return;
        const newRows = this.#rows.slice();
        newRows.splice(index, 1);
        return new TableNode(newRows, this.#position, this.#caption);

    }

    withoutColumn(index: number): TableNode | undefined {

        if(index < 0 || index >= this.getColumnCount()) return;
        const newRows = this.#rows.slice();
        for(let r = 0; r < this.#rows.length; r++)
            newRows[r].splice(index, 1);
        return new TableNode(newRows, this.#position, this.#caption);

    }

    withNewColumn(index: number): TableNode | undefined {

        if(this.#rows.length > 0 && (index < 0 || index > this.#rows[0].length)) return;

        // Figure out how many rows the table has and add a column 
        const newRows = this.#rows.slice();
        for(let r = 0; r < this.#rows.length; r++) {
            newRows[r] = newRows[r].slice();
            newRows[r].splice(index, 0, new FormatNode("", [ new TextNode() ]));
        }
        return new TableNode(newRows, this.#position, this.#caption);

    }

    withContentInRange(range: CaretRange): this | undefined {

        const containsStart = this.contains(range.start.node);
        const containsEnd = this.contains(range.end.node);
        if(!containsStart && !containsEnd) return this.copy();

        // If it contains the start, skip rows until we find the cell with the start node.
        // If it contains the end, skip rows after we find the cell with the end node.
        let r = 0, c = 0;
        let foundStart = false;
        let foundEnd = false;
        let newRows: FormatNode[][] = [];
        for(; r < this.#rows.length; r++, c = 0) {
            const row = this.#rows[r];
            
            // Skip this row if this table contains the start node and we haven't found it and the row doesn't contain it
            if(containsStart && !foundStart && row.find(r => r.contains(range.start.node)) === undefined)
                continue;
            // Stop if we found the end row.
            if(containsEnd && foundEnd)
                break;

            newRows.push([] as FormatNode[]);
            for(; c < row.length; c++) {
                if(!foundStart && row[c].contains(range.start.node)) foundStart = true;
                const newCell = row[c].withContentInRange(range);
                if(newCell === undefined) return;
                newRows[newRows.length - 1].push(
                    (((containsStart && foundStart) || !containsStart) && ((containsEnd && !foundEnd) || !containsEnd)) ? 
                        newCell : 
                        new FormatNode("", [ new TextNode() ]));
                if(row[c].contains(range.end.node)) foundEnd = true;
            }

        }

        const newCaption = this.#caption.withContentInRange(range);
        if(newCaption === undefined) return;

        return new TableNode(newRows, this.#position, newCaption) as this;
    }

}