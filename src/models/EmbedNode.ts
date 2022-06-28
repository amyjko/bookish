import { Node } from "./Node";
import { Position } from "./Position";
import { FormatNode } from "./FormatNode";
import { TextNode } from "./TextNode";
import { BlockNode } from "./BlockNode";
import { CaretRange } from "./Caret";

export class EmbedNode extends BlockNode {

    readonly #url: string;
    readonly #description: string;
    readonly #caption: FormatNode;
    readonly #credit: FormatNode;
    readonly #position: Position;

    constructor(url: string, description: string, caption?: FormatNode, credit?: FormatNode, position: Position="|") {

        super();

        this.#url = url;
        this.#description = description;
        this.#caption = caption === undefined ? new FormatNode("", [ new TextNode("") ]) : caption;
        this.#credit = credit == undefined ? new FormatNode("", [ new TextNode("") ]) : credit;
        this.#position = position;

    }

    getType() { return "embed"; }

    getURL() { return this.#url; }
    getDescription() { return this.#description; }
    getCaption() { return this.#caption; }
    getCredit() { return this.#credit; }
    getPosition() { return this.#position; }
    getFormats() { return [ this.#caption, this.#credit ]; }

    toText(): string { return this.#caption.toText(); }

    toBookdown(debug?: number): string {
        return `|${this.#url}|${this.#description}|${this.#caption.toBookdown(debug)}|${this.#credit.toBookdown(debug)}|`;
    }

    toJSON() {
        return {
            url: this.#url,
            alt: this.#description,
            caption: this.#caption.toText(),
            credit: this.#credit.toText()
        };
    }

    getChildren() { return [ this.#caption, this.#credit ]; }

    getParentOf(node: Node): Node | undefined {

        if(node === this.#caption || node === this.#credit) return this;
        const captionParent = this.#caption.getParentOf(node);
        if(captionParent) return captionParent;
        const creditParent = this.#credit.getParentOf(node);
        if(creditParent) return creditParent;

    }

    copy() {
        return new EmbedNode(this.#url, this.#description, this.#caption.copy(), this.#credit.copy(), this.#position) as this;
    }

    withChildReplaced(node: Node, replacement: Node | undefined) {
        const newCaption = node === this.#caption && replacement instanceof FormatNode ? replacement : undefined;
        const newCredit = node === this.#credit && replacement instanceof FormatNode ? replacement : undefined;
        return newCaption || newCredit ?
            new EmbedNode(
                this.#url,
                this.#description,
                newCaption === undefined ? this.#caption : newCaption, 
                newCredit === undefined ? this.#credit : newCredit, 
                this.#position
            ) as this :
            undefined;    
    }

    withURL(url: string) { return new EmbedNode(url, this.#description, this.#caption, this.#credit, this.#position); }
    withDescription(description: string) { return new EmbedNode(this.#url, description, this.#caption, this.#credit, this.#position); }
    withCaption(caption: FormatNode) { return new EmbedNode(this.#url, this.#description, caption, this.#credit, this.#position); }
    withCredit(credit: FormatNode) { return new EmbedNode(this.#url, this.#description, this.#caption, credit, this.#position); }
    withPosition(position: Position) { return new EmbedNode(this.#url, this.#description, this.#caption, this.#credit, position); }
    
    withContentInRange(range: CaretRange): this | undefined {

        if(!this.contains(range.start.node) && !this.contains(range.end.node)) return this.copy();
        const newCaption = this.#credit.contains(range.start.node) ? new FormatNode("", [ new TextNode() ] ) : this.#caption.withContentInRange(range);
        const newCredit = this.#caption.contains(range.end.node) ? new FormatNode("", [ new TextNode() ] ) : this.#credit.withContentInRange(range);
        if(newCaption === undefined || newCredit === undefined) return;

        return new EmbedNode(this.#url, this.#description, newCaption, newCredit, this.#position) as this;
        
    }

}