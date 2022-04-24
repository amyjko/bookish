import { FormatNode } from "./FormatNode";
import { AtomNode } from "./AtomNode";
import { TextNode } from "./TextNode";

export class FootnoteNode extends AtomNode<FormatNode> {

    constructor(parent: FormatNode, text: string = "") {
        super(parent, new FormatNode(parent, "", [ new TextNode(parent, text)]), "footnote");
        // Hack: can't pass this before calling super.
        this.getMeta().setParent(this);        
        this.getMeta().getSegments()[0].setParent(this.getMeta());
    }

    toText(): string { return this.getMeta().toText(); }
    toBookdown(): string { return "{" + this.getMeta().toBookdown() + "}"; }

    copy(parent: FormatNode): FootnoteNode {
        const foot = new FootnoteNode(this.getParent() as FormatNode);
        foot.setMeta(this.getMeta().copy(foot));
        return foot;
    }
    
}
