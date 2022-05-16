import { FormatNode } from "./FormatNode";
import { AtomNode } from "./AtomNode";
import { TextNode } from "./TextNode";

export class FootnoteNode extends AtomNode<FormatNode> {

    constructor(parent: FormatNode, text: string = "") {

        super(parent, new FormatNode(undefined, "", []), "footnote");

        this.getMeta().setParent(this);
        this.getMeta().addSegment(new TextNode(this.getMeta(), text));

    }

    toText(): string { return this.getMeta().toText(); }
    toBookdown(debug?: number): string { return "{" + this.getMeta().toBookdown(debug) + "}"; }

    copy(parent: FormatNode): FootnoteNode {
        const foot = new FootnoteNode(parent);
        foot.setMeta(this.getMeta().copy(foot));
        return foot;
    }
    
}
