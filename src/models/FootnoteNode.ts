import { FormattedNode } from "./FormattedNode";
import { AtomNode } from "./AtomNode";

export class FootnoteNode extends AtomNode<FormattedNode> {

    constructor(parent: FormattedNode) {
        super(parent, new FormattedNode(parent, "", []), "footnote");
        // Hack: can't pass this before calling super.
        this.getMeta().setParent(this);        
    }

    toText(): string { return this.getMeta().toText(); }
    toBookdown(): string { return "{" + this.getMeta().toBookdown() + "}"; }

    copy(parent: FormattedNode): FootnoteNode {
        const foot = new FootnoteNode(this.getParent() as FormattedNode);
        foot.setMeta(this.getMeta().copy(foot));
        return foot;
    }
    
}
