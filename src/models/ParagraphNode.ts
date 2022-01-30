import { ChapterNode } from "./ChapterNode";
import { Node } from "./Node";
import { ContentNode } from "./ContentNode";
import { CalloutNode } from "./CalloutNode";


export class ParagraphNode extends Node {
    content: ContentNode | undefined;

    constructor(parent: ChapterNode | CalloutNode) {
        super(parent, "paragraph");
    }

    setContent(content: ContentNode) {
        this.content = content;
    }

    toText(): string {
        return this.content ? this.content.toText() : "";
    }

    traverseChildren(fn: (node: Node) => void): void {
        this.content?.traverse(fn)
    }

    removeChild(node: Node): void {}

}
