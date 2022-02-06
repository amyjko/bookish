import { CaretPosition } from "./ChapterNode";
import { Node } from "./Node";
import { ErrorNode } from "./ErrorNode";
import { TextNode } from "./TextNode";
import { ContentNode } from "./ContentNode";

export type Format = "*" | "_";
export type FormattedNodeSegmentType = ContentNode | TextNode | ErrorNode

export class FormattedNode extends Node {
    format: Format;
    segments: FormattedNodeSegmentType[];

    constructor(parent: ContentNode, format: Format, segments: FormattedNodeSegmentType[]) {
        super(parent, "formatted");
        this.format = format;
        this.segments = segments;
    }

    toText(): string {
        return this.segments.map(segment => segment.toText()).join(" ");
    }

    toBookdown() {
        return this.format + this.segments.map(s => s.toBookdown()).join("") + this.format;
    }

    traverseChildren(fn: (node: Node) => void): void {
        this.segments.forEach(item => item.traverse(fn))
    }

    removeChild(node: Node): void {
        // Remove the node, if we found it.
        this.segments = this.segments.filter(item => item !== node)
    }

    getSiblingOf(child: Node, next: boolean) { return this.segments[this.segments.indexOf(child as FormattedNodeSegmentType) + (next ? 1 : -1)]; }

    copy(parent: ContentNode) {
        const segments: (ContentNode | TextNode | ErrorNode)[] = []
        const node = new FormattedNode(parent, this.format, segments)
        this.segments.forEach(s => segments.push(s.copy(node)))
        return node;
    }

    deleteBackward(index: number | Node | undefined): CaretPosition | undefined {

        // If a node is given, find out what index it represents.
        if(index instanceof Node)
            index = this.segments.indexOf(index as FormattedNodeSegmentType);

        // If it's the leftmost node, then ask the parent to backspace to the left of this formatted node.
        if(index === 0)
            return this.parent?.deleteBackward(this);

        // If it's undefined, ask the rightmost segment to backspace from the right.
        if(index === undefined) {
            // If are segments, backspace over the rightmost one.
            if(this.segments.length > 0)
                return this.segments[this.segments.length - 1].deleteBackward(undefined);
            // Otherwise, have the parent handle it.
            else
                return this.parent?.deleteBackward(undefined);
        }

        // Otherwise, find the segment to the left of the given index and have it backspace.
        return this.segments[index - 1].deleteBackward(undefined);

    }

    deleteForward(index: number | Node | undefined): CaretPosition | undefined {

        // If a node is given, find out what index it represents.
        if(index instanceof Node)
            index = this.segments.indexOf(index as FormattedNodeSegmentType);

        // If it's the rightmost node, then ask the parent to backspace to the left of this formatted node.
        if(index === this.segments.length - 1)
            return this.parent?.deleteForward(this);

        // If it's undefined, ask the leftmost segment to delete from the left.
        if(index === undefined) {
            // If are segments, backspace over the rightmost one.
            if(this.segments.length > 0)
                return this.segments[0].deleteForward(undefined);
            // Otherwise, have the parent handle it.
            else
                return this.parent?.deleteForward(undefined);
        }

        // Otherwise, find the segment to the right of the given index and have it backspace.
        return this.segments[index].deleteForward(undefined);

    }

    deleteRange(start: number, end: number): CaretPosition {
        console.error("Don't know how to delete FormattedNode range yet.")
        return { node: this.nodeID, index: 0 };
    }

    clean() {
        if(this.segments.length === 0) this.remove();
    }

    // Replace this formatted node with it's segments.
    unwrap() {

        const parent = this.parent as ContentNode;
        if(!parent) return;

        // Move all of the formatted node's segments.
        const index = parent.segments.indexOf(this);
        const segments: FormattedNodeSegmentType[] = [];
        this.segments.forEach((segment, i) => { segment.parent = parent; parent.segments.splice(index + i, 0, segment) });

        // Remove this formatted node and it's children.
        this.remove();

    }

}