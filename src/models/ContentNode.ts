import { Node } from "./Node";
import { BlockNode  } from "./Parser";
import { TextNode } from "./TextNode";
import { CaretPosition } from "./ChapterNode";
import { FormattedNode } from "./FormattedNode";
import { SubSuperscriptNode } from "./SubSuperscriptNode";
import { FootnoteNode } from "./FootnoteNode";
import { LinkNode } from "./LinkNode";
import { EmbedNode } from "./EmbedNode";

export type ContentParent = BlockNode | FormattedNode | SubSuperscriptNode | FootnoteNode | LinkNode | EmbedNode

export class ContentNode extends Node {
    segments: Node[];
    constructor(parent: ContentParent | undefined, segments: Node[]) {
        super(parent, "content");
        this.segments = segments;
    }

    toText(): string {
        return this.segments.map(segment => segment.toText()).join(" ");
    }

    toBookdown() {
        return this.segments.map(s => s.toBookdown()).join("");
    }

    traverseChildren(fn: (node: Node) => void): void {
        this.segments.forEach(item => item.traverse(fn))
    }

    removeChild(node: Node): void {
        this.segments = this.segments.filter(item => item !== node)
    }

    replaceChild(node: Node, replacement: Node): void {
        const index = this.segments.indexOf(node as Node);
        if(index < 0) return;
        this.segments[index] = replacement;
    }

    getSiblingOf(child: Node, next: boolean) { return this.segments[this.segments.indexOf(child as BlockNode) + (next ? 1 : -1)]; }

    copy(parent: ContentParent): ContentNode {
        const segments: Node[] = []
        const node = new ContentNode(parent, segments)
        this.segments.forEach(s => segments.push(s.copy(node)))
        return node;
    }

    deleteBackward(index: number | Node | undefined): CaretPosition | undefined {

        // If we're backspacing from the right, ask the rightmost segment to backspace.
        if(index === undefined)
            index = this.segments.length - 1;

        // Find the index of the given node
        if(index instanceof Node)
            index = this.segments.indexOf(index) - 1;
        
        // Oops.
        if(index < 0 || this.segments.length === 0)
            return this.parent?.deleteBackward(undefined);

        // If we have an index, backspace from the right of the node to the left.
        return this.segments[index].deleteBackward(undefined);

    }

    deleteForward(index: number | Node | undefined): CaretPosition | undefined {

        // If we're backspacing from the left, ask the left segment to backspace.
        if(index === undefined)
            index = 0;

        // Find the index of the given node
        if(index instanceof Node)
            index = this.segments.indexOf(index) + 1;
        
        // Oops.
        if(index >= this.segments.length || this.segments.length === 0)
            return this.parent?.deleteForward(undefined);

        // If we have an index, backspace from the right of the node to the left.
        return this.segments[index].deleteForward(undefined);

    }

    deleteRange(start: number, end: number): CaretPosition {
        console.error("Don't know how to delete ContentNode range yet.")
        return { node: this.nodeID, index: 0 };
    }


    insert(char: string, index: number): CaretPosition | undefined {

        // Create an empty text node if there are no segments in this content node
        if(this.segments.length === 0)
            this.segments.unshift(new TextNode(this, "", 0))

        // Get all the text nodes in this node
        const text = this.getNodes().filter(node => node instanceof TextNode) as TextNode[]
        
        // Find the first text node and have it insert the character.
        // We have to do a tree traversal to find it, since the first segment might not be a text node.
        return text[0]?.insert(char, 0);
        
    }

    clean() {
        if(this.segments.length === 0) this.remove();
    }

}