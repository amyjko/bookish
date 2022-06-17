import { Node } from "./Node";
import { Position } from "./Position";
import { FormatNode } from "./FormatNode";
import { TextNode } from "./TextNode";
import { BlockNode } from "./BlockNode";

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

    toBookdown(parent: Node, debug?: number): string {
        return `|${this.#url}|${this.#description}|${this.#caption.toBookdown(this, debug)}|${this.#credit.toBookdown(this, debug)}|`;
    }

    toJSON() {
        return {
            url: this.#url,
            alt: this.#description,
            caption: this.#caption.toText(),
            credit: this.#credit.toText()
        };
    }

    traverseChildren(fn: (node: Node) => void): void {
        this.#credit.traverse(fn);
        this.#caption.traverse(fn);
    }

    getParentOf(node: Node): Node | undefined {
        
        const captionParent = this.#caption.getParentOf(node);
        if(captionParent) return captionParent;

        const creditParent = this.#credit.getParentOf(node);
        if(creditParent) return creditParent;

    }

    copy(): EmbedNode {
        return new EmbedNode(this.#url, this.#description, this.#caption.copy(), this.#credit.copy(), this.#position);
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
            ) :
            undefined;    
    }

    withURL(url: string) { new EmbedNode(url, this.#description, this.#caption, this.#credit, this.#position); }
    withDescription(description: string) { new EmbedNode(this.#url, description, this.#caption, this.#credit, this.#position); }
    withCaption(caption: FormatNode) { new EmbedNode(this.#url, this.#description, caption, this.#credit, this.#position); }
    withCredit(credit: FormatNode) { new EmbedNode(this.#url, this.#description, this.#caption, credit, this.#position); }
    withPosition(position: Position) { new EmbedNode(this.#url, this.#description, this.#caption, this.#credit, position); }

}