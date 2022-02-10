import { CaretPosition } from "./ChapterNode";
import { ContentNode } from "./ContentNode";
import { FormattedNode } from "./FormattedNode";
import { Node } from "./Node";

export type TextNodeParent = ContentNode | FormattedNode;

export class TextNode extends Node {
    text: string;
    position: number;
    constructor(parent: TextNodeParent, text: string, position: number) {
        super(parent, "text");
        this.text = text;
        this.position = position - text.length;
    }

    toText(): string {
        return this.text;
    }

    toBookdown() {

        // Escape all characters with special meaning inside content nodes: _*`<^{~\[@% and :'s with no space after
        return new String(this.text)
            .replace(/\\/g, '\\\\') // This has to go first! Otherwise it breaks all of the others below.
            .replace(/_/g, '\\_')
            .replace(/\*/g, '\\*')
            .replace(/`/g, '\\`')
            .replace(/</g, '\\<')
            .replace(/\^/g, '\\^')
            .replace(/{/g, '\\{')
            .replace(/~/g, '\\~')
            .replace(/ %/g, ' \\%')
            .replace(/\[/g, '\\[')
            .replace(/@/g, '\\@')
            .replace(/(:)([a-z])/g, '\\:$2')

    }

    previousText() {
        const chap = this.getChapter()
        if(chap === undefined) return undefined;

        const text = chap.getTextNodes()
        const index = text.indexOf(this)
        // If we didn't find it or this is the first text node, there is no previous text node.
        return index < 1 ? undefined : text[index - 1];
    }

    nextText() {
        const chap = this.getChapter()
        if(chap === undefined) return undefined;

        const text = chap.getTextNodes()
        const index = text.indexOf(this)
        // If we didn't find it or this is the first text node, there is no previous text node.
        return index < 0 || index === text.length - 1 ? undefined : text[index + 1];
    }

    traverseChildren(fn: (node: Node) => void): void {}
    
    removeChild(node: Node): void {}

    replaceChild(node: Node, replacement: Node): void {}

    getSiblingOf(child: Node, next: boolean) { return undefined; }

    copy(parent: ContentNode | FormattedNode) {
        return new TextNode(parent, this.text, this.position)
    }

    insert(char: string, index: number): CaretPosition {
        this.text = this.text.slice(0, index) + char + this.text.slice(index);
        return {
            node: this.nodeID,
            index: index + 1
        };
    }

    deleteBackward(index: number | Node | undefined): CaretPosition | undefined {

        // There are no nodes in text nodes.
        if(index instanceof Node)
            return undefined;

        // If no number was given, backspace from the right.
        if(index === undefined)
            index = this.text.length;

        // If index is 0, delegate to the parent.
        if(index === 0)
            return this.parent?.deleteBackward(this);

        // Delete the character at the index and move the caret one left.
        this.text = this.text.slice(0, index - 1) + this.text.slice(index);
        return {
            node: this.nodeID,
            index: index - 1
        }
        
    }

    deleteForward(index: number | Node | undefined): CaretPosition | undefined {

        // There are no nodes in text nodes.
        if(index instanceof Node)
            return undefined;

        // If no number was given, start on the right.
        if(index === undefined)
            index = 0;

        // If index is the end of this string, delegate to the parent.
        if(index === this.text.length)
            return this.parent?.deleteForward(this);

        // Delete the character at the index.
        this.text = this.text.slice(0, index) + this.text.slice(index + 1);

        // Keep the caret where it is.
        return {
            node: this.nodeID,
            index: index
        }
        
    }

    deleteRange(start: number, end: number): CaretPosition {
        
        // They can be given out of order, so sort them.
        const first = Math.min(start, end, this.text.length);
        const last = Math.max(start, end, 0);

        // Remove the text
        this.text = this.text.slice(0, first) + this.text.slice(last);

        // Keep the caret at the start.
        return {
            node: this.nodeID,
            index: first
        }
        
    }

    wrap(start: number, end: number, formatted: FormattedNode) {

        if(!this.parent) return;

        const parent = this.parent as TextNodeParent;

        // If we're wrapping the whole node, just replace it. This keeps the tree tidier.
        if(start === 0 && end === this.text.length) {
            this.parent = formatted;
            formatted.segments.push(this);
            parent.segments[parent.segments.indexOf(this)] = formatted;
            return {
                node: formatted.nodeID,
                index: 0
            }
        }

        // Otherwise, splice it.
        const left = this.text.substring(0, start);
        const middle = this.text.substring(start, end);
        const right = this.text.substring(end);

        // Modify the original text node.
        this.text = left;

        // Create a new formatted text node
        formatted.segments.push(new TextNode(formatted as TextNodeParent, middle, 0));

        // Insert the middle and right after the original node.
        const segmentIndex = parent.segments.indexOf(this);
        parent.segments.splice(segmentIndex + 1, 0, formatted);
        parent.segments.splice(segmentIndex + 2, 0, new TextNode(parent as TextNodeParent, right, 0));

        // Select the formatted node.
        return {
            node: formatted.segments[0].nodeID,
            index: 0
        };

    }

    clean() {
        if(this.text.length === 0) this.remove();
    }

}
