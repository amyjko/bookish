import { FormattedNode } from "./FormattedNode";
import { AtomNode } from "./AtomNode";
import { TextNode } from "./TextNode";

export class FootnoteNode extends AtomNode<FormattedNode> {

    constructor(parent: FormattedNode, text: string = "") {
        super(parent, new FormattedNode(parent, "", [ new TextNode(parent, text, 0)]), "footnote");
        // Hack: can't pass this before calling super.
        this.getMeta().setParent(this);        
        this.getMeta().getSegments()[0].setParent(this.getMeta());
    }

    toText(): string { return this.getMeta().toText(); }
    toBookdown(): string { return "{" + this.getMeta().toBookdown() + "}"; }

    copy(parent: FormattedNode): FootnoteNode {
        const foot = new FootnoteNode(this.getParent() as FormattedNode);
        foot.setMeta(this.getMeta().copy(foot));
        return foot;
    }
    
}
