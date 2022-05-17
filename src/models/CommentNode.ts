import { AtomNode } from "./AtomNode";
import { FormatNode } from "./FormatNode";

export class CommentNode extends AtomNode<FormatNode> {

    constructor(parent: FormatNode, comment: FormatNode) {
        super(parent, comment, "comment");
        comment.setParent(this);
    }

    toText(): string { return ""; }
    toBookdown(debug?: number): string { 
        // The space before the % is critical, as it enables parsing.
        return `${debug === this.nodeID ? "%debug%" : ""} %${this.getMeta().toBookdown(debug)}%`; 
    }
    copy(parent: FormatNode): CommentNode { return new CommentNode(parent, this.getMeta()); }

}