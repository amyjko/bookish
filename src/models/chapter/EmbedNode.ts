import { Node } from "./Node";
import { Position } from "./Position";
import { FormatNode } from "./FormatNode";
import { TextNode } from "./TextNode";
import { BlockNode } from "./BlockNode";
import { CaretRange } from "./Caret";

export class EmbedNode extends BlockNode {

    /**
     * The URL is actually a space separated set of up to two URLs. The first is a full-size image URL, the second is a smaller image.
     * These are used for responsive rendering and to limit bandwidth usage. Any image URLs after the second are ignored.
     */
    readonly #url: string;
    readonly #description: string;
    readonly #caption: FormatNode;
    readonly #credit: FormatNode;
    readonly #position: Position;

    constructor(url: string, description: string, caption?: FormatNode, credit?: FormatNode, position: Position="|") {

        super();

        this.#url = url;
        this.#description = description;
        this.#caption = caption === undefined ? new FormatNode("", [ new TextNode() ]) : caption.withTextIfEmpty();
        this.#credit = credit == undefined ? new FormatNode("", [ new TextNode() ]) : credit.withTextIfEmpty();
        this.#position = position;

    }

    getType() { return "embed"; }
    getURL() { return this.#url.split(" ")[0]; }
    getSmallURL() { return this.isLocal() ? "images/small/" + this.getURL() : this.hasSmallURL() ? this.#url.split(" ")[1] : this.getURL(); }
    hasSmallURL() { return this.#url.split(" ").length > 1 && this.#url.split(" ")[1].trim().length > 0; }
    isLocal() { return !this.#url.startsWith("http"); }
    getDescription() { return this.#description; }
    getCaption() { return this.#caption; }
    getCredit() { return this.#credit; }
    getPosition() { return this.#position; }
    getFormats() { return [ this.#credit, this.#caption ]; }
    getChildren() { return [ this.#credit, this.#caption ]; }
    getParentOf(node: Node): Node | undefined {
        if(node === this.#caption || node === this.#credit) return this;
        const captionParent = this.#caption.getParentOf(node);
        if(captionParent) return captionParent;
        const creditParent = this.#credit.getParentOf(node);
        if(creditParent) return creditParent;
    }
    
    toText(): string { return this.#caption.toText(); }
    toBookdown(): string {
        return `|${this.#url}|${this.#description}|${this.#caption.toBookdown()}|${this.#credit.toBookdown()}|`;
    }
    toJSON() {
        return {
            url: this.#url,
            alt: this.#description,
            caption: this.#caption.toText(),
            credit: this.#credit.toText()
        };
    }

    copy() {
        return new EmbedNode(this.#url, this.#description, this.#caption.copy(), this.#credit.copy(), this.#position) as this;
    }

    withChildReplaced(node: Node, replacement: Node | undefined) {
        const newCaption = (node === this.#caption && (replacement === undefined || replacement instanceof FormatNode)) ? replacement : this.#caption;
        const newCredit = (node === this.#credit && (replacement === undefined || replacement instanceof FormatNode)) ? replacement : this.#credit;
        return newCaption || newCredit ?
            new EmbedNode(
                this.#url,
                this.#description,
                newCaption, 
                newCredit, 
                this.#position
            ) as this :
            undefined;    
    }

    withURL(url: string) { return new EmbedNode(url, this.#description, this.#caption, this.#credit, this.#position); }
    withURLs(url: string, thumbnail: string) { return new EmbedNode(url + " " + thumbnail, this.#description, this.#caption, this.#credit, this.#position); }
    withDescription(description: string) { return new EmbedNode(this.#url, description, this.#caption, this.#credit, this.#position); }
    withCaption(caption: FormatNode) { return new EmbedNode(this.#url, this.#description, caption, this.#credit, this.#position); }
    withCredit(credit: FormatNode) { return new EmbedNode(this.#url, this.#description, this.#caption, credit, this.#position); }
    withPosition(position: Position) { return new EmbedNode(this.#url, this.#description, this.#caption, this.#credit, position); }
    
    withContentInRange(range: CaretRange): this | undefined {

        if(!this.contains(range.start.node) && !this.contains(range.end.node)) return this.copy();
        const newCredit = this.#caption.contains(range.start.node) ? new FormatNode("", [ new TextNode() ] ) : this.#credit.withContentInRange(range);
        const newCaption = this.#credit.contains(range.end.node) ? new FormatNode("", [ new TextNode() ] ) : this.#caption.withContentInRange(range);
        if(newCaption === undefined || newCredit === undefined) return;

        return new EmbedNode(this.#url, this.#description, newCaption, newCredit, this.#position) as this;
        
    }

}