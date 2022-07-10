import { Caret, CaretRange } from "./Caret";
import { FormatNode } from "./FormatNode";
import { Node } from "./Node";
import { AtomNode } from "./AtomNode";
import { BlocksNode } from "./BlocksNode";
import { RootNode } from "./RootNode";

export class TextNode extends Node {

    readonly #text: string;

    constructor(text: string="") {
        super();
        this.#text = text;
    }

    getType() { return "text"; }
    getText() { return this.#text; }
    getLength() { return this.#text.length; }
    getCaretPositionCount() { return this.#text.length; }
    getParentOf(node: Node): Node | undefined { return undefined; }
    getFirstCaret(): Caret { return { node: this, index: 0}; }
    getLastCaret(): Caret { return { node: this, index: this.#text.length }; }

    toText(): string { return this.#text; }

    toBookdown(): string {

        // Escape all characters with special meaning inside content nodes: _*`<^{~\[@% and :'s with no space after
        return this.#text
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

    }

    getChildren() { return []; }

    copy() { return new TextNode(this.#text) as this; }

    isItalic(root: Node) { return this.getAncestors(root).filter(p => p instanceof FormatNode && p.getFormat() === "_").length > 0; }
    isBold(root: Node) { return this.getAncestors(root).filter(p => p instanceof FormatNode && p.getFormat() === "*").length > 0; }
    
    isEmpty() { return this.getLength() === 0; }

    getFormat(root: Node): FormatNode | undefined {
        return this.getClosestParentOfType<FormatNode>(root, FormatNode);
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
        return this.getClosestParentOfType<BlocksNode>(root, BlocksNode);
    }

    getNextCaret(index: number): Caret | undefined {
        return index < this.#text.length ? { node: this, index: index + 1 } : undefined
    }

    getPreviousCaret(index: number): Caret | undefined {
        return index > 0 ? { node: this, index: index - 1 } : undefined
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
        const format = this.getFormatRoot(root);
        const formatTextNodes = format ? format.getTextNodes() : undefined;
        const nextNode = root.getNextTextOrAtom(this);
        const nextWord = nextNode?.nextWord(root);

        // If there isn't one, just go to the end of this.
        if(formatTextNodes && nextNode && this === formatTextNodes[formatTextNodes.length - 1])
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
        const format = this.getFormatRoot(root);
        const formatTextNodes = format ? format.getTextNodes() : undefined;
        const previousNode = root.getPreviousTextOrAtom(this);
        const previousWord = previousNode?.previousWord(root);

        // If there isn't one, just go to the end of this.
        if(formatTextNodes && previousNode && this === formatTextNodes[0])
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

    withoutRange(range: CaretRange): TextNode | undefined {
        if(range.start.node !== this && range.end.node !== this) return;
        return new TextNode(this.#text.substring(0, range.start.index) + this.#text.substring(range.end.index));
    }
    
    withContentInRange(range: CaretRange): this | undefined { 

        const includesStart = range.start.node === this;
        const includesEnd = range.end.node === this;
        return new TextNode(this.#text.substring(includesStart ? range.start.index : 0, includesEnd ? range.end.index : this.#text.length)) as this;

    }

}