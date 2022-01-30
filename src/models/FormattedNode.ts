import { ChapterNode } from "./ChapterNode";
import { Node } from "./Node";
import { ErrorNode } from "./ErrorNode";
import { TextNode } from "./TextNode";
import { ContentNode } from "./ContentNode";


export class FormattedNode extends Node {
    format: string;
    segments: (ContentNode | TextNode | ErrorNode)[];

    constructor(parent: ContentNode, format: string, segments: Array<ContentNode | TextNode | ErrorNode>) {
        super(parent, "formatted");
        this.format = format;
        this.segments = segments;
    }

    toText(): string {
        return this.segments.map(segment => segment.toText()).join(" ");
    }

    traverseChildren(fn: (node: Node) => void): void {
        this.segments.forEach(item => item.traverse(fn))
    }

    removeChild(node: Node): void {
        // Remove the node, if we found it.
        this.segments = this.segments.filter(item => item !== node)
        // If there are no more segments, remove this too.
        if(this.segments.length === 0)
            this.remove()
    }

}
