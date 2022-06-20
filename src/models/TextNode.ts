import { MetadataNode } from "./MetadataNode";
import { Caret } from "./Caret";
import { FormatNode } from "./FormatNode";
import { Node } from "./Node";
import { ParagraphNode } from "./ParagraphNode";
import { AtomNode } from "./AtomNode";
import { CodeNode } from "./CodeNode";
import { BlocksNode } from "./BlocksNode";
import { RootNode } from "./RootNode";

export type TextNodeParent = FormatNode | MetadataNode<any> | CodeNode;

export class TextNode extends Node {

    readonly #text: string;

    constructor(text: string) {
        super();
        this.#text = text;
    }

    getType() { return "text"; }
    getText() { return this.#text; }
    getLength() { return this.#text.length; }
    getParentOf(node: Node): Node | undefined { return undefined; }

    toText(): string { return this.#text; }

    toBookdown(debug?: number): string {

        // Escape all characters with special meaning inside content nodes: _*`<^{~\[@% and :'s with no space after
        let newString = new String(this.#text)
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
            .replace(/(:)([a-z])/g, '\\:$2');

        // If we're trying to mark this node
        if(debug === this.nodeID)
            newString = "%debug%" + newString;

        return newString;

    }

    getChildren() { return []; }

    copy() { return new TextNode(this.#text) as this; }

    isItalic(root: Node) { return this.getAncestors(root).filter(p => p instanceof FormatNode && p.getFormat() === "_").length > 0; }
    isBold(root: Node) { return this.getAncestors(root).filter(p => p instanceof FormatNode && p.getFormat() === "*").length > 0; }
    
    isEmpty() { return this.getLength() === 0; }

    getParagraph(root: Node): ParagraphNode | undefined {
        return this.closestParent<ParagraphNode>(root, ParagraphNode);
    }

    getFormat(root: Node): FormatNode | undefined {
        return this.closestParent<FormatNode>(root, FormatNode);
    }

    getFormatRoot(root: Node): FormatNode | undefined {

        // The format root is the highest format in the tree that contains this text.
        // There is one exception to this, however: formats inside atom nodes shouldn't traverse
        // past the atom node, since should be isolated from edits outside the atom.
        const atom = this.getClosestParentMatching(root, p => p instanceof AtomNode) as AtomNode<FormatNode>;
        if(atom && atom.getMeta() instanceof FormatNode)
            return atom.getMeta();

        // If this isn't in an atom, just return the highest format this is in.
        return this.getFarthestParentMatching(root, p => p instanceof FormatNode) as FormatNode;

    }

    getBlocks(root: Node): BlocksNode | undefined {
        return this.closestParent<BlocksNode>(root, BlocksNode);
    }

    next(root: RootNode, index: number): Caret {
    
        // Otherwise, find the next text node after this one.
        const next = root.getNextTextOrAtom(this);

        // If there are more characters, just go next.
        if(index < this.#text.length) {
            // If the next node is an empty node, go into it instead.
            if(index + 1 === this.getLength() && next && next instanceof TextNode && next.isEmpty())
                return { node: next, index: 0 };
            // Otherwise, just go to the next position in this text node.
            else
                return { node: this, index: index + 1 };
        }
        
        // If we don't have a root or nothing is next, just return what we were given.
        if(next === undefined)
            return { node: this, index: index };

        // If this is the last node, return the end of this node.
        if(next === this)
            return { node: this, index: this.#text.length };

        // Otherwise, return the beginning of the next node.
        // Unless the next node is in a different paragraph, we skip the first index since it's equivalent to the last of this one.
        return next instanceof AtomNode ?
            { node: next, index: 0 } :
            { node: next, index: this.getFormatRoot(root) !== next.getFormatRoot(root) ? 0 : Math.min(1, next.getLength()) };

    }

    previous(root: RootNode, index: number): Caret {

        // Otherwise, find the previous text node before this one.
        const previous = root.getPreviousTextOrAtom(this);
    
        // If there are more characters, just go next.
        if(index > 0) {
            // If the next node is an empty node, go into it instead.
            if(index - 1 === 0 && previous && previous instanceof TextNode && previous.isEmpty())
                return { node: previous, index: previous.getLength() };
            // Otherwise, just go to the previous position in this text node.
            else
                return { node: this, index: index - 1 };
        }

        // If we don't have a root or nothing is before, just return what we were given.
        if(previous === undefined)
            return { node: this, index: index };

        // If this is the first node, return the beginning of this node.
        if(previous === this)
            return { node: this, index: 0 };

        // Otherwise, return the beginning of the next node.
        // We skip the last index since it's the equivalent of this one's first.
        return previous instanceof AtomNode ?
            { node: previous, index: 0} :
            { node: previous, index: this.getFormatRoot(root) !== previous.getFormatRoot(root) ? previous.#text.length : Math.max(0, previous.#text.length - 1) };

    }

    nextWord(root: RootNode, index?: number): Caret {

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
        const paragraph = this.getParagraph(root);
        const paragraphText = paragraph ? paragraph.getTextNodes() : undefined;
        const nextNode = root.getNextTextOrAtom(this);
        const nextWord = nextNode?.nextWord(root);

        // If there isn't one, just go to the end of this.
        if(paragraphText && nextNode && this === paragraphText[paragraphText.length - 1])
            return { node: nextNode, index: 0 };
        else if(nextWord === undefined)
            return { node: this, index: this.#text.length };
         else
            return nextWord;

    }

    previousWord(root: RootNode, index?: number): Caret {

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
        const paragraph = this.getParagraph(root);
        const paragraphText = paragraph ? paragraph.getTextNodes() : undefined;
        const previousNode = root.getPreviousTextOrAtom(this);
        const previousWord = previousNode?.previousWord(root);

        // If there isn't one, just go to the end of this.
        if(paragraphText && previousNode && this === paragraphText[0])
            return { node: previousNode, index: previousNode instanceof TextNode ? previousNode.getLength() : 0 };
        else if(previousWord === undefined)
            return { node: this, index: 0 };
         else
            return previousWord;

    }

    withChildReplaced(node: Node, replacement: Node | undefined) { return undefined; }
    
    withCharacterAt(char: string, index: number): TextNode | undefined {
        if(index < 0 || index > this.#text.length) return undefined;
        return new TextNode(this.#text.slice(0, index) + char + this.#text.slice(index));
    }
    
}