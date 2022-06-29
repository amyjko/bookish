import { AtomNode } from "./AtomNode";
import { Caret, CaretRange } from "./Caret";
import { FormatNode } from "./FormatNode";
import { Node } from "./Node";

export class CommentNode extends AtomNode<FormatNode> {

    constructor(comment: FormatNode) {
        super(comment.withTextIfEmpty());

    }

    getType() { return "comment"; }
    toText(): string { return ""; }

    getDefaultCaret(): Caret | undefined { return this.getMeta().getFirstCaret(); }

    toBookdown(debug?: number, format?: FormatNode): string { 
        const previousText = format?.getPreviousTextOrAtom(this)?.toBookdown();
        // Insert a space before the % if there isn't one before this.
        return `${previousText?.endsWith(" ") ? "" : " "}%${debug === this.nodeID ? "%debug%" : ""}${this.getMeta().toBookdown(debug)}%`; 
    }

    copy() { return new CommentNode(this.getMeta().copy()) as this; }

    withChildReplaced(node: Node, replacement: Node | undefined) {
        return node instanceof FormatNode && replacement instanceof FormatNode && node === this.getMeta() ?
            new CommentNode(replacement) as this : 
            undefined;    
    }

    getParentOf(node: Node): Node | undefined {
        return node === this.getMeta() ? this : this.getMeta().getParentOf(node);
    }

    withMeta(comment: FormatNode) { return new CommentNode(comment); }

    withContentInRange(range: CaretRange): this | undefined { 
        const newFormat = this.getMeta().withContentInRange(range);
        if(newFormat === undefined) return;
        return this.withMeta(newFormat) as this;    
    }

}