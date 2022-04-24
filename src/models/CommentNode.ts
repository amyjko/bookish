import { AtomNode } from "./AtomNode";
import { FormatNode } from "./FormatNode";

export class CommentNode extends AtomNode<string> {

    constructor(parent: FormatNode, comment: string) {
        super(parent, comment, "comment");
    }

    toText(): string { return ""; }
    toBookdown(): string { return "%" + this.getMeta() + "%"; }
    copy(parent: FormatNode): CommentNode { return new CommentNode(parent, this.getMeta()); }

}