import { Node } from "./Node";
import { ErrorNode } from "./ErrorNode";
import { TextNode } from "./TextNode";
import { BlockNode } from "./BlockNode";
import { FootnoteNode } from "./FootnoteNode";
import { EmbedNode } from "./EmbedNode";
import { Caret, CaretRange } from "./Caret";
import { MetadataNode } from "./MetadataNode";
import { AtomNode } from "./AtomNode";

export type Format = "" | "*" | "_" | "^" | "v";
export type FormatNodeSegmentType = FormatNode | TextNode | ErrorNode | MetadataNode<any> | AtomNode<any>;
export type FormatNodeParent = BlockNode | FormatNode | FootnoteNode | EmbedNode;

export class FormatNode extends Node<FormatNodeParent> {
    #format: Format;
    #segments: FormatNodeSegmentType[];

    constructor(parent: FormatNodeParent | undefined, format: Format, segments: FormatNodeSegmentType[]) {
        super(parent, "formatted");
        this.#format = format;
        this.#segments = segments;
        // Make sure parents are assigned correctly.
        segments.forEach(seg => seg.setParent(this));
    }

    getFormat() { return this.#format; }
    getSegments() { return this.#segments; }
    setSegments(segs: FormatNodeSegmentType[]) { this.#segments = segs; }
    isEmpty() { return this.#segments.length === 0; }
    getLength() { return this.#segments.length; }

    toText(): string {
        return this.#segments.map(segment => segment.toText()).join(" ");
    }

    toBookdown(): string {
        return (this.#format === "v" ? "^v" : this.#format) + this.#segments.map(s => s.toBookdown()).join("") + this.#format;
    }

    addSegment(node: FormatNodeSegmentType) {
        node.setParent(this);
        this.#segments.push(node);
    }

    addEmptyText() {
        this.addSegment(new TextNode(this, ""));
    }

    traverseChildren(fn: (node: Node) => void): void {
        this.#segments.forEach(item => item.traverse(fn))
    }

    removeChild(node: Node): void {
        // Remove the node, if we found it.
        this.#segments = this.#segments.filter(item => item !== node);
        // If this now has no segments, remove it.
        if(this.#segments.length === 0)
            this.remove();
    }

    getFirstTextNode(): TextNode {
        const text = this.getTextNodes();
        return text[0];
    }

    getLastTextNode(): TextNode {
        const text = this.getTextNodes();
        return text[text.length - 1];
    }

    replaceChild(node: Node, replacement: FormatNodeSegmentType): void {
        // Find the given node's index.
        const index = this.#segments.indexOf(node as FormatNodeSegmentType);
        if(index < 0) return;
        // Replace it.
        replacement.setParent(this);
        this.#segments[index] = replacement;
        // Normalize the tree.
        this.clean();
    }

    getSiblingOf(child: Node, next: boolean) { return this.#segments[this.#segments.indexOf(child as FormatNodeSegmentType) + (next ? 1 : -1)]; }

    copy(parent: FormatNodeParent) {
        const node = new FormatNode(parent, this.#format, []);
        this.#segments.forEach(s => node.addSegment(s.copy(node) as FormatNodeSegmentType));
        return node;
    }

    mergeText() {
        // Are there any consecutive text nodes? Merge them.
        let currentText: TextNode | undefined = undefined;
        let textToRemove: TextNode[] = [];
        for(let i = 0; i < this.#segments.length; i++) {
            let node = this.#segments[i];
            if(node instanceof TextNode) {
                // Found the first one!
                if(currentText === undefined)
                    currentText = node;
                // Slurp the current node's text
                else {
                    currentText.setText(currentText.getText() + node.getText());
                    textToRemove.push(node);
                }
            }
            // If not, reset the current text.
            else
                currentText = undefined;
        }
        textToRemove.forEach(n => n.remove());

    }

    mergeFormats() {

        // Go through each node in the segments list and flatten 
        const merged: FormatNodeSegmentType[] = [];
        while(this.getLength() > 0) {
            const next = this.#segments.shift();
            if(next) {
                // If it's an empty text node, remove it.
                if(next instanceof TextNode) {
                    if(next.getLength() > 0)
                        merged.push(next);
                }
                // If there's no previous node, just add the next node.
                else if(merged.length === 0) {
                    merged.push(next);
                }
                // Otherwise, base our action on the previous node
                else {
                    const previous = merged[merged.length - 1];
                    // The previous and next nodes are the same format, merge next with previous.
                    if(previous instanceof FormatNode && next instanceof FormatNode && previous.getFormat() === next.getFormat()) {
                        // Merge the segments of the two nodes.
                        next.getSegments().forEach(n => { previous.addSegment(n); });
                    }
                    // Otherwise just 
                    else {
                        merged.push(next);
                    }
                }
            }
        }
        this.#segments = merged;

        // Merge any adjacent text that we created.
        this.mergeText();

    }

    getFormatRoot(): FormatNode | undefined {
        return this.getFarthestParentMatching(p => p instanceof FormatNode) as FormatNode;
    }

    isFormatRoot(): boolean {
        return this.getFormatRoot() === this;
    }

    clean() {

        // Clean all of the segments bottom up first.
        this.#segments.forEach(s => s.clean());

        // If this is empty and it's not the root, remove it.
        if(this.#segments.length === 0 && this.getFormatRoot() !== this) { 
            this.remove();
            return;
        }
    
        // Merge merge redundant formatted nodes
        this.mergeFormats();

        // If this is in a format with the same format as its parent, move this node's segments to the parent to flatten it.
        const parent = this.getParent();
        if(parent instanceof FormatNode && this.getFormat() === parent.getFormat()) {
            this.#segments.forEach(seg => seg.setParent(parent));
            const index = parent.getSegments().indexOf(this);
            if(index < 0) throw Error("Uh oh, parentage is wrong.");
            parent.#segments = parent.getSegments().slice(0, index).concat(this.getSegments()).concat(parent.getSegments().slice(index + 1));
        }
        
        // If we ended up with no segments, put a placeholder.
        this.addEmptyText();

    }

    getTextNodes(): TextNode[] {
        return this.getNodes().filter(n => n instanceof TextNode) as TextNode[];
    }

    getTextAndAtomNodes(): (TextNode | AtomNode<any>)[] {
        return this.getNodes().filter(n => n instanceof TextNode || n instanceof AtomNode) as (TextNode | AtomNode<any>)[];
    }

    getNextTextOrAtom(node: TextNode | AtomNode<any>): TextNode | AtomNode<any> | undefined {
        // Otherwise, find the next text node after this one.
        const text = this.getTextAndAtomNodes();
        const index = text.indexOf(node);
        return index === undefined ? undefined :
            index < text.length - 1 ? text[index + 1] :
            undefined;
    }

    getPreviousTextOrAtom(node: TextNode | AtomNode<any>): TextNode | AtomNode<any> | undefined {
        // Otherwise, find the next text node after this one.
        const text = this.getTextAndAtomNodes();
        const index = text.indexOf(node);
        return index === undefined ? undefined :
            index > 0 ? text[index - 1] :
            undefined;
    }

    caretToTextIndex(caret: Caret): number {

        if(!(caret.node instanceof TextNode))
            throw Error("Can only get text position of text nodes");

        const text = this.getTextNodes();
        let index = 0;
        for(let i = 0; i < text.length; i++) {
            const t = text[i];
            if(t !== caret.node)
                index += t.getLength();
            else {
                index += caret.index;
                break;
            }
        }

        return index;

    }

    textIndexToCaret(index: number): Caret | undefined {

        const text = this.getTextNodes();
        let currentIndex = 0;
        for(let i = 0; i < text.length; i++) {
            const t = text[i];
            if(index >= currentIndex && index <= currentIndex + t.getLength())
                return { node: t, index: index - currentIndex };
            currentIndex += t.getLength();
        }
        return undefined;

    }

    // Creates two formatted nodes that split this node at the given caret location.
    split(caret: Caret): FormatNode[] | undefined {

        // We can only copy if
        // ... this has a parent.
        // ... the given caret is in this formatted node.
        // ... the caret is on a text node.        
        const parent = this.getParent();
        if(parent === undefined || !caret.node.hasParent(this) || !(caret.node instanceof TextNode))
            return undefined;

        // Map the caret node to an index
        const nodeIndex  = this.getTextNodes().indexOf(caret.node);

        // Make two copies of this
        const first = this.copy(parent);
        const second = this.copy(parent);

        // Compute the equivalent caret for each
        // Find what index this node is in the paragraph so we can find its doppleganger in the copy.
        const firstCaret = { node: first.getTextNodes()[nodeIndex], index: caret.index };
        const secondCaret = { node: second.getTextNodes()[nodeIndex], index: caret.index };

        // Delete everything after in the first, everything before in the second.
        first.deleteRange({ start: firstCaret, end: first.getLastCaret() });
        second.deleteRange({ start: second.getFirstCaret(), end: secondCaret });
    
        // Here ya go caller!
        return [first, second];

    }

    getFirstCaret(): Caret {
        return { node: this.getTextNodes()[0], index: 0 };
    }

    getLastCaret(): Caret {
        const nodes = this.getTextNodes();
        const last = nodes[nodes.length - 1];
        return { node: last, index: last.getLength() };
    }

    getSelection(): CaretRange {

        const first = this.getFirstTextNode();
        const last = this.getLastTextNode();
        return { start: { node: first, index: 0}, end: { node: last, index: last.getLength() } };

    }

    deleteRange(range: CaretRange) {

        // Just keep backspacing from the end caret until the returned caret is identical to the previous caret or the start caret.
        let previousCaret = undefined;
        let startPosition = this.caretToTextIndex(range.start);
        let currentCaret = range.end;
        let currentPosition = this.caretToTextIndex(range.end);

        // Don't delete if the range is a single position.
        if(startPosition === currentPosition)
            return;

        do {
            previousCaret = currentCaret;
            currentCaret = (currentCaret.node as TextNode).deleteBackward(currentCaret.index);
            currentPosition = this.caretToTextIndex(currentCaret);
        } while(
            currentPosition > startPosition &&
            !(previousCaret.node === currentCaret.node && previousCaret.index === currentCaret.index)
        );

        return currentCaret;

    }

    formatRange(range: CaretRange, format: Format): CaretRange {

        // This only transforms ranges that start and end with text nodes and for nodes in the same format node.
        if( !(range.start.node instanceof TextNode) || 
            !(range.end.node instanceof TextNode) || 
            !(range.start.node.getCommonAncestor(range.end.node) instanceof FormatNode))
            return range;

        // Remember the text positions so we can return a new range in the new tree.
        const textStart = this.caretToTextIndex(range.start);
        const textEnd = this.caretToTextIndex(range.end);

        // Find all of the content in the node so we can construct a new format tree with the old content.
        const everythingButFormats = 
            this.getNodes().filter(n => (n instanceof TextNode && !(n.getParent() instanceof MetadataNode)) || n instanceof AtomNode || n instanceof ErrorNode || n instanceof MetadataNode) as (TextNode | AtomNode<any> | MetadataNode<any>)[];

        // Check if all of the selected content has the requested format so we can toggle it if so.
        let checkIndex = 0;
        let checkingEmptyNode = false;
        const alreadyApplied = everythingButFormats.every(node => {
            // If it's text, and the current position is in range of the selection, does the position contain the requested format?
            if(node instanceof TextNode) {
                // If we have a zero-width selection, remember, so we can ignore it in the next text node at the same location.
                if(node.getText().length === 0) {
                    if(checkIndex === textStart && textStart === textEnd) {
                        checkingEmptyNode = true;
                        return (node.getParent() as FormatNode).getFormats().includes(format);
                    }
                    else return true;
                }
                // If it has longer than zero characters, formatting is applied if all characters in range the node have it applied.
                else {
                    let allFormatted = true;
                    for(let i = 0; i < node.getText().length; i++) {
                        if((!checkingEmptyNode && checkIndex === textStart && textStart === textEnd) || (checkIndex >= textStart && checkIndex < textEnd))
                            allFormatted = allFormatted && (node.getParent() as FormatNode).getFormats().includes(format);
                        checkIndex++;
                    }
                    return allFormatted;
                }
            }
            // Treat all non-text as containing the requested format.
            else return true;
        });

        // Reformat everything. The strategy is to step through each character, atom node, and metadata node in this format node
        // and create a new series of formats that preserve existing formatting while applying new formatting to the selection.
        const newFormat = new FormatNode(this.getParent(), "", []); // The current formatter we're adding to.
        let currentFormat = newFormat;
        let textIndex = 0;
        let currentText = ""; // The current text we've accumulated, inserted before each format change and at the end.
        let formattingEmptyNode = false;
        let emptyNode = undefined;
        everythingButFormats.forEach(node => {
            if(node instanceof TextNode) {
                // Remember we found an empty node so that we don't insert an extra one later.
                if(node.getText().length === 0) {
                    if(textIndex === textStart && textStart === textEnd) {
                        formattingEmptyNode = true;
                    }
                }
                else {
                    // Process each character in the node.
                    for(let i = 0; i < node.getText().length; i++) {

                        // Determine the desired format for this character. Start with the current formats
                        // and if we're in the selected range, adjust them accordingly based on the current formats 
                        // and the requested format.
                        let desiredFormats = (node.getParent() as FormatNode).getFormats();
                        if( (textIndex === textStart && textStart === textEnd) || 
                            (textIndex >= textStart && textIndex < textEnd)) {
                            // Remove all formatting if we were asked to.
                            if(format === "")
                                desiredFormats = [];
                            // Apply the formatting if it's not already applied.
                            else if(!alreadyApplied && !desiredFormats.includes(format))
                                desiredFormats.push(format);
                            // Remove the formatting if it's already applied in the selection.
                            else if(alreadyApplied && desiredFormats.includes(format))
                                desiredFormats.splice(desiredFormats.indexOf(format), 1);
                        }

                        // Remove undesired formats.
                        currentFormat.getFormats().forEach(current => {
                            // If the current format is not in the desired list, close the text
                            // node and keep popping formats until we find the parent of the offending format.
                            if(!desiredFormats.includes(current)) {
                                if(currentText.length > 0) {
                                    currentFormat.addSegment(new TextNode(currentFormat, currentText));
                                    currentText = "";
                                }
                                // Not sure this loop is necessary; we should always remove in the order we added.
                                while(currentFormat.#format !== current)
                                    currentFormat = currentFormat.getParent() as FormatNode;
                                currentFormat = currentFormat.getParent() as FormatNode;

                                // If we have unformatted something at a zero-width range, create empty format node, add a text node in it and remember it so
                                // we can place the caret in it.
                                if(!formattingEmptyNode && textIndex === textStart && textStart === textEnd) {
                                    emptyNode = new TextNode(currentFormat, "");
                                    currentFormat.addSegment(emptyNode);
                                    const newDesiredFormat = new FormatNode(currentFormat, current, []);
                                    currentFormat.addSegment(newDesiredFormat);
                                    currentFormat = newDesiredFormat;
                                }

                            }
                        });

                        // Ensure the desired formats.
                        desiredFormats.forEach(desiredFormat => {
                            // If the current format does not yet include the desired format,
                            // close the text node and start a new format.
                            if(!currentFormat.getFormats().includes(desiredFormat)) {
                                if(currentText.length > 0) {
                                    currentFormat.addSegment(new TextNode(currentFormat, currentText));
                                    currentText = "";
                                }

                                const newDesiredFormat = new FormatNode(currentFormat, desiredFormat, []);
                                currentFormat.addSegment(newDesiredFormat);
                                currentFormat = newDesiredFormat;

                                // If we inserted an empty format node, add a text node in it and remember it so
                                // we can place the caret in it.
                                if(!formattingEmptyNode && textIndex === textStart && textStart === textEnd) {
                                    emptyNode = new TextNode(currentFormat, "");
                                    currentFormat.addSegment(emptyNode);
                                    currentFormat = newDesiredFormat.getParent() as FormatNode;
                                }
        
                            }
                        });

                        // Append the current text.
                        currentText += node.getText().charAt(i);
                        textIndex++;
                    }
                }
            }
            // If it's not text, just add the segment unmodified, since we only format text.
            else {
                // Before adding the atom, create a text node and reset the accumulator.
                if(currentText.length > 0) {
                    currentFormat.addSegment(new TextNode(currentFormat, currentText));
                    currentText = "";
                }
                // Add the atom immediately after.
                currentFormat.addSegment(node);
            }
        });

        // Add any text that we haven't included yet.
        if(currentText.length > 0)
            currentFormat.addSegment(new TextNode(currentFormat, currentText));

        // Replace this format's segments with the new segments.
        this.#segments = [];
        newFormat.#segments.forEach(seg => this.addSegment(seg));

        // If we made an empty node, place the caret in it.
        if(emptyNode)
            return { start: { node: emptyNode, index: 0 }, end: { node: emptyNode, index: 0}};

        // Convert the text selection back into a CaretRange, keeping selection on the same text.
        const startCaret = this.textIndexToCaret(textStart);
        const endCaret = this.textIndexToCaret(textEnd);
        if(startCaret && endCaret)
            return { start: startCaret, end: endCaret };

        throw Error("Couldn't map original positions onto new formatting; something is very broken!");

    }

    getFormats(): Format[] {

        let format: FormatNodeParent | undefined = this;
        const formats: Format[] = [];
        while(format instanceof FormatNode) {
            if(format.#format !== "")
                formats.push(format.#format);
            format = format.getParent();
        }
        return formats;

    }

    insertSegmentAt(segment: FormatNodeSegmentType, caret: Caret) : Caret {

        if(!(caret.node instanceof TextNode))
            return caret;

        // Verify that the caret's node is a segment in this node.
        const index = this.#segments.indexOf(caret.node);
        if(index < 0)
            return caret;

        // Splice the text node.
        const left = new TextNode(this, caret.node.getText().substring(0, caret.index));
        const right = new TextNode(this, caret.node.getText().substring(caret.index));

        // Insert the new left, right and middle
        this.#segments.splice(index, 1, left, segment, right);

        // Return the first index in the new node's text node.
        return { node: segment, index: 0 };

    }

}