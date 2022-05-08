import { AtomNode } from "./AtomNode";
import { FormatNode } from "./FormatNode";

export class CommentNode extends AtomNode<FormatNode> {

    constructor(parent: FormatNode, comment: FormatNode) {
        super(parent, comment, "comment");
        comment.setParent(this);
    }

    toText(): string { return ""; }
    toBookdown(): string { return "%" + this.getMeta().toBookdown() + "%"; }
    copy(parent: FormatNode): CommentNode { return new CommentNode(parent, this.getMeta()); }

}