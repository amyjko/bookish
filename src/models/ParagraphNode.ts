import { Node } from "./Node";
import { FormattedNodeSegmentType, FormattedNode, Format } from "./FormattedNode";
import { BlockNode } from "./BlockNode";
import { BlockParentNode } from "./BlockParentNode";
import { TextNode } from "./TextNode";
import { Caret, CaretRange } from "./Caret";

export class ParagraphNode extends Node<BlockParentNode> {

    #content: FormattedNode;
    #level: number;

    constructor(parent: BlockParentNode, level: number = 0) {
        super(parent, "paragraph");
        this.#content = new FormattedNode(this, "", []);
        // An empty text node to start.
        this.#content.addSegment(new TextNode(this.#content, "", 0));

        // Assign whatever level is given.
        this.#level = level;
    }

    getLevel() { return this.#level; }
    setLevel(level: number) { this.#level = level; }

    setContent(content: FormattedNode) {
        content.setParent(this);
        this.#content = content;
    }

    getContent() { return this.#content; }

    toText(): string {
        return this.#content.toText();
    }

    toBookdown() {
        return (this.#level === 1 ? "# " : this.#level === 2 ? "## " : this.#level === 3 ? "### " : "") + this.#content.toBookdown();
    }

    traverseChildren(fn: (node: Node) => void): void {
        this.#content?.traverse(fn)
    }

    removeChild(node: Node): void {}

    replaceChild(node: Node, replacement: FormattedNode): void {
        if(this.#content === node)
            this.#content = replacement;
    }

    getSiblingOf(child: Node, next: boolean) { return undefined; }

    copy(parent: BlockParentNode): ParagraphNode {
        const p = new ParagraphNode(parent, this.#level);
        if(this.#content) p.setContent(this.#content.copy(p))
        return p;
    }

    getFirstTextNode(): TextNode { return this.getContent().getFirstTextNode(); }

    getLastTextNode(): TextNode { return this.getContent().getLastTextNode(); }

    getPreviousIfParagraph(): ParagraphNode | undefined {
        return this.getSiblingIfType(-1, ParagraphNode);
    }

    getNextIfParagraph(): ParagraphNode | undefined {
        return this.getSiblingIfType(1, ParagraphNode);
    }

    getSiblingIfType<T extends BlockNode>(offset: number, type: Function): T | undefined  {
        const parent = this.getParent();
        const blocks = parent?.getBlocks();
        const index = blocks?.indexOf(this);
        const next = index !== undefined && blocks ? blocks[index + offset] : undefined;
        return next instanceof type ? next as T : undefined;
    }

    getTextNodes(): TextNode[] {
        return this.getNodes().filter(n => n instanceof TextNode) as TextNode[];
    }

    appendParagraph(paragraph : ParagraphNode) {

        // Copy the given paragraph's segments into this paragraph's segments.
        paragraph.getContent().getSegments().forEach(segment => {
            this.#content.addSegment(segment);
        });

        // Remove the given paragraph from its context.
        paragraph.remove();

        // Clean this paragraph to merge any new text nodes at the boundary.
        this.clean();
        
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

        // If we weren't given a text node, do nothing.
        if(!(caret.node instanceof TextNode))
            return caret;

        // If the caret is at the last position of the paragraph, insert a new paragraph.
        const lastTextNode = this.getLastTextNode();
        if(caret.node === lastTextNode && caret.index == lastTextNode.getLength()) {
            const newParagraph = new ParagraphNode(parent);
            parent.insertAfter(this, newParagraph);
            return { node: newParagraph.getFirstTextNode(), index: 0 };
        }

        // Find what index this node is in the paragraph so we can find its doppleganger in the copy.
        const caretNodeIndex  = this.getTextNodes().indexOf(caret.node);

        // Copy this paragraph and insert it after.
        const copy = this.copy(parent);
        parent.insertAfter(this, copy);

        // Delete everything after the caret.
        chapter.deleteSelection({ start: caret, end: { node: lastTextNode, index: lastTextNode.getText().length}}, false);

        // Delete everything before the caret in the copy.
        const newNodePosition = copy.getTextNodes()[caretNodeIndex];

        // If there's anything to delete, delete it.
        if(newNodePosition)
            chapter.deleteSelection({ start: { node: copy.getFirstTextNode(), index: 0 }, end: { node: newNodePosition, index: caret.index }}, false);

        // Clean up this and the new paragraph.
        this.clean();
        copy.clean();

        // Return a caret at the beginning of the new paragraph.
        return { node: copy.getFirstTextNode(), index: 0 };        

    }


    format(range: CaretRange, format: Format): CaretRange {

        const formatted = range.start.node.getCommonAncestor(range.end.node);
        if(formatted && formatted.getClosestParentMatching(node => node instanceof ParagraphNode) !== this)
            throw Error("Can't format a caret range that isn't within this particular ParagraphNode.");

        return this.#content.formatRange(range, format);

    }

    clean() {
        this.#content.clean();
        // Make sure the paragraph always has an empty text node so that it's navigable.
        if(this.#content.getSegments().length === 0)
            this.#content.addSegment(new TextNode(this.#content, "", 0));
    }
    
}
