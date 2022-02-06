import { CaretPosition, ChapterNode } from "./ChapterNode";
import { Node } from "./Node";
import { Position } from "./Parser";
import { ContentNode } from "./ContentNode";
import { CalloutNode } from "./CalloutNode";
import { QuoteNode } from "./QuoteNode";

export type TableParent = ChapterNode | CalloutNode | QuoteNode

export class TableNode extends Node {
    rows: ContentNode[][];
    caption: ContentNode | undefined;
    position: Position;

    constructor(parent: TableParent, rows: ContentNode[][]) {
        super(parent, "table");
        this.rows = rows;
        this.position = "|";
    }

    setPosition(position: Position) {
        this.position = position;
    }

    setCaption(caption: ContentNode) {
        this.caption = caption;
    }

    toText() {
        return this.rows.map(row => row.map(cell => cell.toText()).join(", ")).join(", ");
    }

    toBookdown(): String {
        return this.rows.map(row => `\n,${row.map(cell => cell.toBookdown()).join("|")}`) + 
            `\n${this.position === "|" ? "" : this.position}${this.caption ? "" + this.caption.toBookdown() : ""}`;
    }

    traverseChildren(fn: (node: Node) => void): void {
        this.rows.forEach(row => row.forEach(cell => cell.traverse(fn)))
        this.caption?.traverse(fn)
    }

    removeChild(node: Node): void {}

    getSiblingOf(child: Node, next: boolean) { return undefined; }

    copy(parent: TableParent): TableNode {
        const rows: ContentNode[][] = [];
        const node = new TableNode(parent, rows);
        if(this.caption) node.setCaption(this.caption.copy(node))
        this.rows.forEach(row => {
            const cells: ContentNode[] = []
            row.forEach(cell => cells.push(cell.copy(node)))
            rows.push(cells)
        })
        return node;

    }

    deleteBackward(index: number | Node | undefined): CaretPosition | undefined {
        throw Error("Table deleteBackward not implemented.")
    }

    deleteRange(start: number, end: number): CaretPosition {
        throw new Error("Table deleteRange not implemented.");
    }
    
    deleteForward(index: number | Node | undefined): CaretPosition | undefined {
        throw new Error("Table deleteForward not implemented.");
    }

    clean() {}

}
