import { MetadataNode } from "./MetadataNode";
import { Caret, ChapterNode } from "./ChapterNode";
import { FormattedNode } from "./FormattedNode";
import { Node } from "./Node";
import { ParagraphNode } from "./ParagraphNode";
import { AtomNode } from "./AtomNode";
import { CodeNode } from "./CodeNode";

export type TextNodeParent = FormattedNode | MetadataNode<any> | CodeNode;

export class TextNode extends Node<TextNodeParent> {

    #text: string;
    #position: number;

    constructor(parent: TextNodeParent, text: string, position: number) {
        super(parent, "text");
        this.#text = text;
        this.#position = position - text.length;
    }

    getPosition() { return this.#position; }

    getText() { return this.#text; }
    getLength() { return this.#text.length; }
    setText(text: string) { this.#text = text; }

    toText(): string { return this.#text; }

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

        // If the given index is after the first character, delete it.
        if(index > 0) {
            // Delete the character at the index and move the caret one left.
            this.#text = this.#text.slice(0, index - 1) + this.#text.slice(index);
            return { node: this, index: index - 1 };
        }

        // If this is the first text node in a paragraph, backspace over the block before it.
        const paragraph = this.getParagraph();
        const firstText = paragraph?.getFirstTextNode();
        if(paragraph && firstText === this) {
            // Is the block before a paragraph? Merge this paragraph with the previous one,
            // returning a caret at the given index of this text node.
            const previousParagraph = paragraph.getPreviousIfParagraph();
            if(previousParagraph) {
                // Remember the text position of the last position in the previous paragraph.
                const lastText = previousParagraph.getLastTextNode();
                const textPosition = previousParagraph.getContent().caretToTextIndex({ node: lastText, index: lastText.getLength() });
                previousParagraph.appendParagraph(paragraph);
                const newCaret = previousParagraph.getContent().textIndexToCaret(textPosition);
                if(newCaret)
                    return newCaret;
                else throw Error("Couldn't map caret back to new position.");
            }
            // Otherwise, delete the previous block.
            else {
                const previousBlock = paragraph.getParent()?.getSiblingOf(paragraph, false);
                if(previousBlock)
                    previousBlock.remove();
                return { node: this, index: index };
            }
        }

        // Otherwise, see if there's a previous node.
        const previous = this.getChapter()?.getPreviousTextOrAtom(this);

        // If there isn't one, don't delete, don't change anything; just return the beginning of this. We've reached the beginning.
        if(previous === undefined)
            return { node: this, index: index };

        // Otherwise, delete from the previous node.
        const newCaret = previous.deleteBackward();

        // If this is empty, delete it, then normalize the paragraph.
        if(this.getLength() === 0)
            return this.deleteAndClean(newCaret);

        // Return the new caret position.
        return newCaret;
        
    }

    deleteForward(index?: number): Caret {

        // If no index, delete from the beginning.
        if(index === undefined)
            index = 0;

        // If this is within bounds, delete.
        if(index < this.#text.length) {
            // Delete the character at the index and move the caret one left.
            this.#text = this.#text.slice(0, index) + this.#text.slice(index + 1);
            return { node: this, index: index };
        }

        // If this is the last text node in a paragraph, merge the next paragraph with this one,
        // returning a caret at the given index of this text node.
        const paragraph = this.getParagraph();
        const lastText = paragraph?.getLastTextNode();
        if(paragraph && lastText === this) {
            const nextParagraph = paragraph.getNextIfParagraph();
            if(nextParagraph) {
                // Remember the position of the last index of the last text node so we can map back after cleaning.
                const lastText = paragraph.getLastTextNode();
                const textPosition = paragraph.getContent().caretToTextIndex({ node: lastText, index: lastText.getLength() });
                paragraph.appendParagraph(nextParagraph);
                const newCaret = paragraph.getContent().textIndexToCaret(textPosition);
                if(newCaret)
                    return newCaret;
                else throw Error("Couldn't map caret back to new position.");
            }
            else {
                const nextBlock = paragraph.getParent()?.getSiblingOf(paragraph, true);
                if(nextBlock)
                    nextBlock.remove();   
                return { node: this, index: index };
            }
        }

        // Otherwise, ask the previous word to delete.
        const next = this.getChapter()?.getNextTextOrAtom(this);

        // If there isn't one, don't change anything, we've reached the end of the text.
        if(next === undefined)
            return { node: this, index: index };

        // Otherwise, have the previous node delete.
        const newCaret = next.deleteForward();

        // If this is empty, delete it, then normalize the paragraph.
        if(this.getLength() === 0)
            return this.deleteAndClean(newCaret);

        // Return the new caret position.
        return newCaret;        
        
    }

    deleteAndClean(caret: Caret): Caret {

        const formatter = this.getRoot();
        if(formatter === undefined)
            return caret;

        const textPosition = formatter.caretToTextIndex(caret);
        formatter.clean();
        const cleanCaret = formatter.textIndexToCaret(textPosition);
        if(cleanCaret)
            return cleanCaret;
        else throw Error("Couldn't map caret back to new position.");

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

    getParagraph(): ParagraphNode | undefined {
        return this.getClosestParentMatching(p => p instanceof ParagraphNode) as ParagraphNode | undefined;
    }

    getFormattedRoot(): FormattedNode | undefined {
        return this.getFarthestParentMatching(p => p instanceof FormattedNode) as FormattedNode;
    }

    getRoot(): FormattedNode | ChapterNode | undefined {
        const format = this.getFarthestParentMatching(p => p instanceof FormattedNode) as FormattedNode;
        const chapter = this.getFarthestParentMatching(p => p instanceof ChapterNode) as ChapterNode;
        return chapter ? chapter : format ? format : undefined;
    }

    next(index: number): Caret {
    
        // If there are more characters, just go next.
        if(index < this.#text.length)
            return { node: this, index: index + 1 }
        
        // Otherwise, find the next text node after this one.
        const next = this.getRoot()?.getNextTextOrAtom(this);

        // If we don't have a chapter, return what we were given.
        if(next === undefined)
            return { node: this, index: index };

        // If this is the last node, return the end of this node.
        if(next === this)
            return { node: this, index: this.#text.length };

        // Otherwise, return the beginning of the next node.
        // Unless the next node is in a different paragraph, we skip the first index since it's equivalent to the last of this one.
        return next instanceof AtomNode ?
            { node: next, index: 0 } :
            { node: next, index: this.getParagraph() !== next.getParagraph() ? 0 : Math.min(1, next.getLength()) };

    }

    previous(index: number): Caret {
    
        // If there are more characters, just go next.
        if(index > 0)
            return { node: this, index: index - 1 }
        
        // Otherwise, find the previous text node before this one.
        const previous = this.getRoot()?.getPreviousTextOrAtom(this);

        // If we don't have a chapter, return what we were given.
        if(previous === undefined)
            return { node: this, index: index };

        // If this is the first node, return the beginning of this node.
        if(previous === this)
            return { node: this, index: 0 };

        // Otherwise, return the beginning of the next node.
        // We skip the last index since it's the equivalent of this one's first.
        return previous instanceof AtomNode ?
            { node: previous, index: 0} :
            { node: previous, index: previous.#text.length };

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
        const paragraph = this.getParagraph();
        const paragraphText = paragraph ? paragraph.getTextNodes() : undefined;
        const nextNode = this.getRoot()?.getNextTextOrAtom(this);
        const nextWord = nextNode?.nextWord();

        // If there isn't one, just go to the end of this.
        if(paragraphText && nextNode && this === paragraphText[paragraphText.length - 1])
            return { node: nextNode, index: 0 };
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
        const paragraph = this.getParagraph();
        const paragraphText = paragraph ? paragraph.getTextNodes() : undefined;
        const previousNode = this.getRoot()?.getPreviousTextOrAtom(this);
        const previousWord = previousNode?.previousWord();

        // If there isn't one, just go to the end of this.
        if(paragraphText && previousNode && this === paragraphText[0])
            return { node: previousNode, index: previousNode instanceof TextNode ? previousNode.getLength() : 0 };
        else if(previousWord === undefined)
            return { node: this, index: 0 };
         else
            return previousWord;

    }

}
