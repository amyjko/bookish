import { Node } from "./Node";
import { BlockParentNode } from "./BlockParentNode";
import { Position } from "./Position";
import { FormattedNode } from "./FormattedNode";
import { TextNode } from "./TextNode";

export class EmbedNode extends Node<BlockParentNode> {
    #url: string;
    #description: string;
    #caption: FormattedNode;
    #credit: FormattedNode;
    #position: Position;

    constructor(parent: BlockParentNode | undefined, url: string, description: string) {
        super(parent, "embed");
        this.#url = url;
        this.#description = description;
        this.#caption = new FormattedNode(this, "", []);
        this.#caption.addEmptyText();
        this.#credit = new FormattedNode(this, "", []);
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
    setCaption(caption: FormattedNode) { this.#caption = caption; }
    setCredit(credit: FormattedNode) { this.#credit = credit; }
    setPosition(position: Position) { this.#position = position; }

    toText(): string {
        return this.#caption.toText();
    }

    toBookdown(): String {
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