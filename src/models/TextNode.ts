import { Caret } from "./ChapterNode";
import { FormattedNode } from "./FormattedNode";
import { Node } from "./Node";

export class TextNode extends Node<FormattedNode> {

    #text: string;
    #position: number;

    constructor(parent: FormattedNode, text: string, position: number) {
        super(parent, "text");
        this.#text = text;
        this.#position = position - text.length;
    }

    getPosition() { return this.#position; }

    getText() { return this.#text; }
    getLength() { return this.#text.length; }
    setText(text: string) { this.#text = text; }

    toText(): string {
        return this.#text;
    }

    toBookdown() {

        // Escape all characters with special meaning inside content nodes: _*`<^{~\[@% and :'s with no space after
        return new String(this.#text)
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

    copy(parent: FormattedNode) {
        return new TextNode(parent, this.#text, this.#position)
    }

    insert(char: string, index: number): Caret {
        this.#text = this.#text.slice(0, index) + char + this.#text.slice(index);
        return {
            node: this,
            index: index + 1
        };
    }

    deleteBackward(index?: number): Caret {

        // If no index, delete from the end.
        if(index === undefined)
            index = this.#text.length;

        // If this is within bounds, delete.
        if(index > 0) {
            // Delete the character at the index and move the caret one left.
            this.#text = this.#text.slice(0, index - 1) + this.#text.slice(index);
            return { node: this, index: index - 1 }
        }

        // Otherwise, ask the previous word to delete.
        const previous = this.getChapter()?.getPreviousTextNode(this);

        // If there isn't one, don't delete, just return the beginning of this.
        if(previous === undefined)
            return { node: this, index: index }

        // Otherwise, have the previous node delete.
        return previous.deleteBackward();
        
    }

    deleteForward(index?: number): Caret {

        // If no index, delete from the beginning.
        if(index === undefined)
            index = 0;

        // If this is within bounds, delete.
        if(index < this.#text.length) {
            // Delete the character at the index and move the caret one left.
            this.#text = this.#text.slice(0, index) + this.#text.slice(index + 1);
            return { node: this, index: index }
        }

        // Otherwise, ask the previous word to delete.
        const next = this.getChapter()?.getNextTextNode(this);

        // If there isn't one, don't delete, just return the beginning of this.
        if(next === undefined)
            return { node: this, index: index }

        // Otherwise, have the previous node delete.
        return next.deleteForward();
        
    }

    deleteRange(start: number, end: number): Caret {
        
        // They can be given out of order, so sort them.
        const first = Math.min(start, end, this.#text.length);
        const last = Math.max(start, end, 0);

        // Remove the text
        this.#text = this.#text.slice(0, first) + this.#text.slice(last);

        // Keep the caret at the start.
        return {
            node: this,
            index: first
        }
        
    }

    deleteAll(): Caret {
        this.#text = "";
        return { node: this, index: 0 };
    }

    clean() {
        if(this.#text.length === 0) this.remove();
    }

    next(index: number): Caret {
    
        // If there are more characters, just go next.
        if(index < this.#text.length)
            return { node: this, index: index + 1 }
        
        // Otherwise, find the next text node after this one.
        const text = this.getChapter()?.getNextTextNode(this);

        // If we don't have a chapter, return what we were given.
        if(text === undefined)
            return { node: this, index: index };

        // If this is the last node, return the end of this node.
        if(text === this)
            return { node: this, index: this.#text.length }

        // Otherwise, return the beginning of the next node.
        // We skip the first index since it's equivalent to the last of this one.
        return { node: text, index: 1 }

    }

    previous(index: number): Caret {
    
        // If there are more characters, just go next.
        if(index > 0)
            return { node: this, index: index - 1 }
        
        // Otherwise, find the previous text node before this one.
        const text = this.getChapter()?.getPreviousTextNode(this);

        // If we don't have a chapter, return what we were given.
        if(text === undefined)
            return { node: this, index: index };

        // If this is the first node, return the beginning of this node.
        if(text === this)
            return { node: this, index: 0 }

        // Otherwise, return the beginning of the next node.
        // We skip the last index since it's the equivalent of this one's first.
        return { node: text, index: text.#text.length - 1 }

    }

    nextWord(index?: number): Caret {

        if(index === undefined)
            index = 0;

        // Search for the space after the given index.
        let i = index + 1;
        for(; i < this.#text.length; i++)
            if(this.#text.charAt(i) === " ")
                break;

        // If we found one in this node, return it.
        if(i < this.#text.length)
            return { node: this, index: i };

        // Otherwise, find the next text node's next word.
        const next = this.getChapter()?.getNextTextNode(this)?.nextWord();

        // If there isn't one, just go to the end of this.
        if(next === undefined)
            return { node: this, index: this.#text.length };
        else
            return next;

    }

    previousWord(index?: number): Caret {

        if(index === undefined)
            index = this.#text.length;

        // Search for the space after the given index.
        let i = index - 1;
        for(; i > 0; i--)
            if(this.#text.charAt(i) === " ")
                break;

        // If we found one in this node, return it.
        if(i > 0)
            return { node: this, index: i };

        // Otherwise, find the next text node's next word.
        const previous = this.getChapter()?.getPreviousTextNode(this)?.previousWord();

        // If there isn't one, just go to the beginning of this.
        if(previous === undefined)
            return { node: this, index: 0 };
        else
            return previous;

    }

}
