import { Node } from "./Node";
import { BlockParentNode } from "./BlockParentNode";
import { Position } from "./Position";
import { FormatNode } from "./FormatNode";

export class EmbedNode extends Node<BlockParentNode> {
    #url: string;
    #description: string;
    #caption: FormatNode;
    #credit: FormatNode;
    #position: Position;

    constructor(parent: BlockParentNode | undefined, url: string, description: string) {
        super(parent, "embed");
        this.#url = url;
        this.#description = description;
        this.#caption = new FormatNode(this, "", []);
        this.#caption.addEmptyText();
        this.#credit = new FormatNode(this, "", []);
        this.#credit.addEmptyText();
        this.#position = "|";
    }

    getURL() { return this.#url; }
    getDescription() { return this.#description; }
    getCaption() { return this.#caption; }
    getCredit() { return this.#credit; }
    getPosition() { return this.#position; }

    setURL(url: string) { this.#url = url; }
    setDescription(description: string) { this.#description = description; }
    setCaption(caption: FormatNode) { this.#caption = caption; }
    setCredit(credit: FormatNode) { this.#credit = credit; }
    setPosition(position: Position) { this.#position = position; }

    toText(): string {
        return this.#caption.toText();
    }

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

    traverseChildren(fn: (node: Node) => void): void {
        this.#credit.traverse(fn);
        this.#caption.traverse(fn);
    }

    removeChild(node: Node): void {}
    
    replaceChild(node: Node, replacement: Node): void {}

    getSiblingOf(child: Node, next: boolean) { return undefined; }

    copy(parent: BlockParentNode): EmbedNode {
        const node = new EmbedNode(parent, this.#url, this.#description);
        node.#caption = this.#caption.copy(this);
        node.#credit = this.#credit.copy(this);
        node.#position = this.#position;
        return node;
    }

    clean() {}

}