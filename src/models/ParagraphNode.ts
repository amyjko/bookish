import { CaretPosition, ChapterNode, Selection } from "./ChapterNode";
import { Node } from "./Node";
import { ContentNode } from "./ContentNode";
import { CalloutNode } from "./CalloutNode";
import { QuoteNode } from "./QuoteNode";

export class ParagraphNode extends Node {
    content: ContentNode;

    constructor(parent: ChapterNode | CalloutNode | QuoteNode) {
        super(parent, "paragraph");
        this.content = new ContentNode(this, []);
    }

    setContent(content: ContentNode) {
        this.content = content;
    }

    toText(): string {
        return this.content.toText();
    }

    toBookdown() {
        return this.content.toBookdown();
    }

    traverseChildren(fn: (node: Node) => void): void {
        this.content?.traverse(fn)
    }

    removeChild(node: Node): void {
        if(this.content === node) this.remove();
    }

    getSiblingOf(child: Node, next: boolean) { return undefined; }

    copy(parent: ChapterNode | CalloutNode | QuoteNode): ParagraphNode {
        const p = new ParagraphNode(parent);
        if(this.content) p.setContent(this.content.copy(p))
        return p;
    }

    deleteBackward(index: number | Node | undefined): CaretPosition | undefined {

        // If the node's previous sibling is a paragraph, merge this paragraph's content into the previous paragraph.
        const sibling = this.getSibling(false);

        // If there is no sibling, keep the caret here.
        if(sibling === undefined || !(sibling instanceof ParagraphNode))  {
            return undefined;
        }
        // If the sibling is a paragraph, merge.
        else if(sibling instanceof ParagraphNode) {

            // Remember the last index of the sibling's content.
            const lastIndexOfSiblingContent = sibling.content ? sibling.content.segments.length : 0;

            // Copy this content's segments into the previous sibling.
            this.content?.segments.forEach(segment => {
                sibling.content?.segments.push(segment.copy(sibling.content));
            });

            // Remove this paragraph.
            this.remove();

            // Place the caret at the end of the previous sibling's content node.
            return {
                node: sibling.content.nodeID,
                index: lastIndexOfSiblingContent
            }

        }
        
    }

    deleteForward(index: number | Node | undefined): CaretPosition | undefined {

        // If the node's previous sibling is a paragraph, merge this paragraph's content into the previous paragraph.
        const sibling = this.getSibling(true);

        // If there is no sibling, keep the caret here.
        if(sibling === undefined || !(sibling instanceof ParagraphNode))  {
            return undefined;
        }
        // If the sibling is a paragraph, merge.
        else if(sibling instanceof ParagraphNode) {

            // Remember the last index of the sibling's content.
            const lastIndexOfContent = this.content.segments.length;

            // Copy the sibling's content into this.
            sibling.content?.segments.forEach(segment => {
                this.content?.segments.push(segment.copy(this.content));
            });

            // Remove the sibling paragraph.
            sibling.remove();

            // Leave the caret alone.
            return {
                node: this.content.nodeID,
                index: lastIndexOfContent
            };

        }
        
    }

    deleteRange(start: number, end: number): CaretPosition {
        throw new Error("Paragraph deleteRange not implemented.");
    }

    insert(char: string, index: number): CaretPosition | undefined {
        return this.content.insert(char, 0);
    }

    clean() {}
    
}
