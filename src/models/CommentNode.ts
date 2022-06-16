import { AtomNode } from "./AtomNode";
import { Caret } from "./Caret";
import { FormatNode } from "./FormatNode";
import { Node } from "./Node";

export class CommentNode extends AtomNode<FormatNode> {

    constructor(comment: FormatNode) {
        super(comment);
    }

    getType() { return "comment"; }
    toText(): string { return ""; }

    getDefaultCaret(): Caret { return this.getMeta().getFirstCaret(); }

    toBookdown(parent: FormatNode, debug?: number): string { 
        const previousText = parent.getPreviousTextOrAtom(this)?.toBookdown(parent);
        // Insert a space before the % if there isn't one before this.
        return `${previousText?.endsWith(" ") ? "" : " "}%${debug === this.nodeID ? "%debug%" : ""}${this.getMeta().toBookdown(this, debug)}%`; 
    }

    copy(): CommentNode { return new CommentNode(this.getMeta().copy()); }

    withChildReplaced(node: Node, replacement: Node | undefined) {
        return node instanceof FormatNode && replacement instanceof FormatNode && node === this.getMeta() ?
            new CommentNode(replacement) : 
            undefined;    
    }

    getParentOf(node: Node): Node | undefined {
        return this.getMeta().getParentOf(node);
    }

    withMeta(comment: FormatNode) { return new CommentNode(comment); }

}