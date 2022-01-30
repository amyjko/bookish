import { ChapterNode } from "./ChapterNode";
import { Node } from "./Node";
import { Position } from "./Parser";
import { ContentNode } from "./ContentNode";
import { CalloutNode } from "./CalloutNode";


export class EmbedNode extends Node {
    url: string;
    description: string;
    caption: ContentNode;
    credit: ContentNode;
    position: Position;

    constructor(parent: ChapterNode | CalloutNode | undefined, url: string, description: string, caption: ContentNode, credit: ContentNode, position: Position) {
        super(parent, "embed");
        this.url = url;
        this.description = description;
        this.caption = caption;
        this.credit = credit;
        this.position = position;
    }

    toText(): string {
        return this.caption.toText();
    }

    toJSON() {
        return {
            url: this.url,
            alt: this.description,
            caption: this.caption.toText(),
            credit: this.credit.toText()
        };
    }

    traverseChildren(fn: (node: Node) => void): void {
        this.caption.traverse(fn);
        this.credit.traverse(fn);
    }

    removeChild(node: Node): void {}

}
