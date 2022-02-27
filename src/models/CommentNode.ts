import { AtomNode } from "./AtomNode";
import { FormattedNode } from "./FormattedNode";
import { Node } from "./Node";

export class CommentNode extends AtomNode<string> {

    constructor(parent: FormattedNode, comment: string) {
        super(parent, comment, "comment");
    }

    toText(): string { return ""; }
    toBookdown(): string { return "%" + this.getMeta() + "%"; }
    copy(parent: FormattedNode): CommentNode { return new CommentNode(parent, this.getMeta()); }

}