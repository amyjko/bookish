import { Caret } from "./ChapterNode";
import { FormattedNode } from "./FormattedNode";
import { Node } from "./Node";
import { ParagraphNode } from "./ParagraphNode";

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

    isItalic() { return this.getAncestors().filter(p => p instanceof FormattedNode && p.getFormat() === "_").length > 0; }
    isBold() { return this.getAncestors().filter(p => p instanceof FormattedNode && p.getFormat() === "*").length > 0; }

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

    getParagraph(): ParagraphNode {
        return this.getClosestParentMatching(p => p instanceof ParagraphNode) as ParagraphNode;
    }

    next(index: number): Caret {
    
        // If there are more characters, just go next.
        if(index < this.#text.length)
            return { node: this, index: index + 1 }
        
        // Otherwise, find the next text node after this one.
        const nextText = this.getChapter()?.getNextTextNode(this);

        // If we don't have a chapter, return what we were given.
        if(nextText === undefined)
            return { node: this, index: index };

        // If this is the last node, return the end of this node.
        if(nextText === this)
            return { node: this, index: this.#text.length }

        // Otherwise, return the beginning of the next node.
        // Unless the next node is in a different paragraph, we skip the first index since it's equivalent to the last of this one.
        return { node: nextText, index: this.getParagraph() !== nextText.getParagraph() ? 0: Math.min(1, nextText.getLength()) };

    }

    previous(index: number): Caret {
    
        // If there are more characters, just go next.
        if(index > 0)
            return { node: this, index: index - 1 }
        
        // Otherwise, find the previous text node before this one.
        const previousText = this.getChapter()?.getPreviousTextNode(this);

        // If we don't have a chapter, return what we were given.
        if(previousText === undefined)
            return { node: this, index: index };

        // If this is the first node, return the beginning of this node.
        if(previousText === this)
            return { node: this, index: 0 }

        // Otherwise, return the beginning of the next node.
        // We skip the last index since it's the equivalent of this one's first.
        return { node: previousText, index: this.getParagraph() !== previousText.getParagraph() ? previousText.#text.length : previousText.#text.length - 1 }

    }

    nextWord(index?: number): Caret {

        if(index === undefined)
            index = 0;

        // Search for the space after the given index.
        let i = index + 1;
        while(i < this.getLength() && this.#text.charAt(i).match(/\W/)) i++;
        while(i < this.getLength() && this.#text.charAt(i).match(/\w/)) i++;

        // If we found one in this node, return it.
        if(i < this.getLength() || (i === this.getLength() && this.#text.charAt(i - 1).match(/\w/)))
            return { node: this, index: i };

        // Otherwise, find the next text node's next word boundary.
        const paragraphText = this.getParagraph().getTextNodes();
        const nextText = this.getChapter()?.getNextTextNode(this);
        const nextWord = nextText?.nextWord();

        // If there isn't one, just go to the end of this.
        if(paragraphText && nextText && this === paragraphText[paragraphText.length - 1])
            return { node: nextText, index: 0 }
        else if(nextWord === undefined)
            return { node: this, index: this.#text.length };
         else
            return nextWord;

    }

    previousWord(index?: number): Caret {

        if(index === undefined)
            index = this.#text.length;

        // Scan left until we find a word character, then keep scanning until we reach a non-word character.
        let i = index - 1;
        while(i > 0 && this.#text.charAt(i - 1).match(/\W/)) i--;
        while(i > 0 && this.#text.charAt(i - 1).match(/\w/)) i--;
            
        // If we found one in this node, return it.
        if(i > 0 || (i === 0 && this.#text.charAt(0).match(/\w/)))
            return { node: this, index: i };

        // Otherwise, find the next text node's next word boundary.
        const paragraphText = this.getParagraph().getTextNodes();
        const previousText = this.getChapter()?.getPreviousTextNode(this);
        const previousWord = previousText?.previousWord();

        // If there isn't one, just go to the end of this.
        if(paragraphText && previousText && this === paragraphText[0])
            return { node: previousText, index: previousText.getLength() }
        else if(previousWord === undefined)
            return { node: this, index: 0 };
         else
            return previousWord;

    }

}
