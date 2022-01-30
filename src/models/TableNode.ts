import { ChapterNode } from "./ChapterNode";
import { Node } from "./Node";
import { Position } from "./Parser";
import { ContentNode } from "./ContentNode";
import { CalloutNode } from "./CalloutNode";


export class TableNode extends Node {
    rows: ContentNode[][];
    caption: ContentNode | undefined;
    position: Position;

    constructor(parent: ChapterNode | CalloutNode, rows: ContentNode[][]) {
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

    traverseChildren(fn: (node: Node) => void): void {
        this.rows.forEach(row => row.forEach(cell => cell.traverse(fn)))
        this.caption?.traverse(fn)
    }

    removeChild(node: Node): void {}

}
