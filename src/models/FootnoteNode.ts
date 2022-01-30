import { ChapterNode } from "./ChapterNode";
import { Node } from "./Node";
import { ContentNode } from "./ContentNode";


export class FootnoteNode extends Node {
    footnote: ContentNode | undefined;
    constructor(parent: ContentNode, ) {
        super(parent, "footnote");
        
    }

    setContent(footnote: ContentNode) {
        this.footnote = footnote;
    }

    toText(): string {
        return this.footnote ? this.footnote.toText() : "";
    }

    traverseChildren(fn: (node: Node) => void): void {
        this.footnote?.traverse(fn)
    }

    removeChild(node: Node): void {}

}
