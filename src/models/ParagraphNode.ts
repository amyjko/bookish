import { Node } from "./Node";
import { FormattedNodeSegmentType, FormattedNode, Format } from "./FormattedNode";
import { BlockParentNode } from "./Parser";
import { TextNode } from "./TextNode";
import { Caret, CaretRange } from "./ChapterNode";

export class ParagraphNode extends Node<BlockParentNode> {

    #content: FormattedNode;

    constructor(parent: BlockParentNode) {
        super(parent, "paragraph");
        this.#content = new FormattedNode(this, "", []);
        // An empty text node to start.
        this.#content.addSegment(new TextNode(this.#content, "", 0));
    }

    setContent(content: FormattedNode) {
        this.#content = content;
    }

    getContent() { return this.#content; }

    toText(): string {
        return this.#content.toText();
    }

    toBookdown() {
        return this.#content.toBookdown();
    }

    traverseChildren(fn: (node: Node) => void): void {
        this.#content?.traverse(fn)
    }

    removeChild(node: Node): void {
        // If this content node is being removed, remove this.
        if(this.#content === node) this.remove();
    }

    replaceChild(node: Node, replacement: FormattedNode): void {
        if(this.#content === node)
            this.#content = replacement;
    }

    getSiblingOf(child: Node, next: boolean) { return undefined; }

    copy(parent: BlockParentNode): ParagraphNode {
        const p = new ParagraphNode(parent);
        if(this.#content) p.setContent(this.#content.copy(p))
        return p;
    }

    getFirstTextNode(): TextNode {
        const text = this.getTextNodes()
        return text[0] as TextNode;
    }

    getLastTextNode(): TextNode {
        const text = this.getTextNodes();
        return text[text.length - 1] as TextNode;
    }

    getTextNodes(): TextNode[] {
        return this.getNodes().filter(n => n instanceof TextNode) as TextNode[];
    }

    deleteBackward(index: number | Node | undefined) {

        // If the node's previous sibling is a paragraph, merge this paragraph's content into the previous paragraph.
        const sibling = this.getSibling(false);

        // If there is no sibling, keep the caret here.
        if(sibling === undefined || !(sibling instanceof ParagraphNode))  {
            return undefined;
        }
        // If the sibling is a paragraph, merge.
        else if(sibling instanceof ParagraphNode) {

            // Remember the last index of the sibling's content.
            const lastIndexOfSiblingContent = sibling.#content ? sibling.#content.getLength() : 0;

            // Copy this content's segments into the previous sibling.
            this.#content?.getSegments().forEach(segment => {
                sibling.#content?.getSegments().push(segment.copy(sibling.#content) as FormattedNodeSegmentType);
            });

            // Remove this paragraph.
            this.remove();

            // Place the caret at the end of the previous sibling's content node.
            return {
                node: sibling.#content.nodeID,
                index: lastIndexOfSiblingContent
            }

        }
        
    }

    deleteForward(index: number | Node | undefined) {

        // If the node's previous sibling is a paragraph, merge this paragraph's content into the previous paragraph.
        const sibling = this.getSibling(true);

        // If there is no sibling, keep the caret here.
        if(sibling === undefined || !(sibling instanceof ParagraphNode))  {
            return undefined;
        }
        // If the sibling is a paragraph, merge.
        else if(sibling instanceof ParagraphNode) {

            // Remember the last index of the sibling's content.
            const lastIndexOfContent = this.#content.getLength();

            // Copy the sibling's content into this.
            sibling.#content?.getSegments().forEach(segment => {
                this.#content?.getSegments().push(segment.copy(this.#content) as FormattedNodeSegmentType);
            });

            // Remove the sibling paragraph.
            sibling.remove();

            // Leave the caret alone.
            return {
                node: this.#content.nodeID,
                index: lastIndexOfContent
            };

        }
        
    }

    split(caret: Caret): Caret {

        // Get the parent
        const parent = this.getParent();

        // Get the chapter
        const chapter = this.getChapter();

        // If it's detached, do nothing.
        if(parent === undefined || chapter === undefined)
            return caret;

        // If the caret is at the last position of the paragraph, insert a new paragraph.
        const originalTextNodes = this.getNodes().filter(n => n instanceof TextNode) as TextNode[];
        if(originalTextNodes.length > 0 && caret.node === originalTextNodes[originalTextNodes.length - 1] && caret.index === originalTextNodes[originalTextNodes.length - 1].getText().length) {
            const newParagraph = new ParagraphNode(parent);
            parent.insertAfter(this, newParagraph);
            return { node: newParagraph.#content.getSegments()[0], index: 0 };
        }

        // Find what index this node is in the paragraph so we can find its doppleganger in the copy.
        const caretNodeIndex  = this.getNodes().indexOf(caret.node);

        // Begin by duplicating the paragraph.
        const copy = this.copy(parent);

        // Insert the copy after the original.
        parent.insertAfter(this, copy);

        // Delete everything after the caret in the original paragraph.
        const textNodes = this.getNodes().filter(n => n instanceof TextNode);
        const lastTextNode = textNodes.length > 0 ? textNodes[textNodes.length - 1] as TextNode : undefined;

        // If we found a text node, delete
        if(lastTextNode && (caret.node !== lastTextNode || caret.index !== lastTextNode.getText().length))
            chapter.deleteSelection({ start: caret, end: { node: lastTextNode, index: lastTextNode.getText().length}}, false)

        // Delete everything before the caret in the copy.
        const copyNodes = copy.getNodes();
        const copyTextNodes = copyNodes.filter(n => n instanceof TextNode);
        const firstTextNode = copyTextNodes.length > 0 ? copyTextNodes[0] as TextNode : undefined;
        const newNodePosition = copyNodes[caretNodeIndex];

        // If there's anything to delete, delete it.
        if(firstTextNode && newNodePosition)
            chapter.deleteSelection({ start: { node: firstTextNode, index: 0 }, end: { node: newNodePosition, index: caret.index }}, false);

        // Return the first text node after deletion.
        return { node: copy.getNodes().filter(n => n instanceof TextNode)[0], index: 0 };        

    }


    format(range: CaretRange, format: Format): CaretRange {

        const formatted = range.start.node.getCommonAncestor(range.end.node);
        if(formatted && formatted.getClosestParentMatching(node => node instanceof ParagraphNode) !== this)
            throw Error("Can't format a caret range that isn't within this particular ParagraphNode.");

        return this.#content.formatRange(range, format);

    }

    clean() {}
    
}
