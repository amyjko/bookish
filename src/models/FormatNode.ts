import { Node } from "./Node";
import { ErrorNode } from "./ErrorNode";
import { TextNode } from "./TextNode";
import { BlockNode } from "./BlockNode";
import { FootnoteNode } from "./FootnoteNode";
import { EmbedNode } from "./EmbedNode";
import { Caret, CaretRange } from "./Caret";
import { MetadataNode } from "./MetadataNode";
import { AtomNode } from "./AtomNode";
import { BlockParentNode } from "./BlockParentNode";
import { ListNode } from "./ListNode";
import { TableNode } from "./TableNode";

export type Format = "" | "*" | "_" | "^" | "v";
export type FormatNodeSegmentType = FormatNode | TextNode | ErrorNode | MetadataNode<any> | AtomNode<any>;
export type FormatNodeParent = BlockNode<BlockParentNode> | FormatNode | FootnoteNode | EmbedNode | ListNode | TableNode | undefined;

export class FormatNode extends Node<FormatNodeParent> {
    
    readonly #format: Format;
    readonly #segments: FormatNodeSegmentType[];

    constructor(format: Format, segments: FormatNodeSegmentType[]) {

        super();

        this.#format = format;
        this.#segments = segments;
        
    }

    getType() { return "formatted"; }
    getFormat() { return this.#format; }
    getSegments() { return this.#segments; }
    isEmpty() { return this.#segments.length === 0; }
    isEmptyTextNode() { return this.#segments.length === 1 && this.#segments[0] instanceof TextNode && this.#segments[0].getText() === ""; }
    getLength() { return this.#segments.length; }

    toText(): string {
        return this.#segments.map(segment => segment.toText()).join(" ");
    }

    toBookdown(parent: FormatNodeParent, debug?: number): string {
        return (this.#format === "v" ? "^v" : this.#format) + this.#segments.map(s => s.toBookdown(this, debug)).join("") + this.#format;
    }

    withSegmentAppended(segment: FormatNodeSegmentType): FormatNode {
        return new FormatNode(this.#format, [ ...this.#segments, segment ]);
    }

    traverseChildren(fn: (node: Node) => void): void {
        this.#segments.forEach(item => item.traverse(fn));
    }

    getFirstTextNode(): TextNode {
        const text = this.getTextNodes();
        return text[0];
    }

    getLastTextNode(): TextNode {
        const text = this.getTextNodes();
        return text[text.length - 1];
    }

    withSegmentReplaced(segment: FormatNodeSegmentType, replacement: FormatNodeSegmentType): FormatNode | undefined {

        const index = this.#segments.indexOf(segment);
        if(index < 0) return undefined;

        const segments = this.#segments.slice();
        segments[index] = replacement;

        return new FormatNode(this.#format, segments);

    }

    withoutSegment(segment: FormatNodeSegmentType): FormatNode | undefined {

        const index = this.#segments.indexOf(segment);
        if(index < 0) return undefined;
        return new FormatNode(this.#format, this.#segments.slice().splice(index, 1));

    }

    withChildReplaced(node: Node, replacement: Node | undefined) {
        return replacement === undefined ? this.withoutSegment(node as FormatNodeSegmentType) : this.withSegmentReplaced(node as FormatNodeSegmentType, replacement as FormatNodeSegmentType);
    }

    copy(): FormatNode {
        return new FormatNode(this.#format, this.#segments.map(s => s.copy()));
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

        const text = this.getTextAndAtomNodes();
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

        const text = this.getTextAndAtomNodes();
        let currentIndex = 0;
        for(let i = 0; i < text.length; i++) {
            const t = text[i];
            if(!(t instanceof AtomNode) && index >= currentIndex && index <= currentIndex + t.getLength())
                return { node: t, index: index - currentIndex };
            currentIndex += t.getLength();
        }
        return undefined;

    }

    // Creates two formatted nodes that split this node at the given caret location.
    split(caret: Caret): [FormatNode, FormatNode] | undefined {

        // We can only copy if
        // ... this has a parent.
        // ... the given caret is in this formatted node.
        // ... the caret is on a text node.        
        if(!(caret.node instanceof TextNode))
            return undefined;

        // Map the caret node to an index
        const nodeIndex  = this.getTextNodes().indexOf(caret.node);

        // Make two copies of this
        const first = this.copy();
        const second = this.copy();

        // Compute the equivalent caret for each
        // Find what index this node is in the paragraph so we can find its doppleganger in the copy.
        const firstCaret = { node: first.getTextNodes()[nodeIndex], index: caret.index };
        const secondCaret = { node: second.getTextNodes()[nodeIndex], index: caret.index };

        // Delete everything after in the first, everything before in the second.
        first.withoutRange({ start: firstCaret, end: first.getLastCaret() });
        second.withoutRange({ start: second.getFirstCaret(), end: secondCaret });
    
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

    withoutRange(range: CaretRange) {
        return this.withFormat(range, undefined);
    }

    // This function takes the given range, and if it's within the bounds of this FormatNode
    // either formats the given range with the given format (or deletes the range if the formed is undefined). 
    // It's approach is to scan through every atomic node and character and build a new tree according to the existing
    // tree, but with the requested modification.
    withFormat(range: CaretRange, format: Format | undefined): FormatNode | undefined {

        // This only transforms ranges that start and end with text nodes and for nodes in the same format node.
        if( !(range.start.node instanceof TextNode || range.start.node instanceof AtomNode) || 
            !(range.end.node instanceof TextNode || range.end.node instanceof AtomNode) || 
            !(this.contains(range.start.node) && this.contains(range.end.node)))
            return;

        // Remember the text positions so we can return a new range in the new tree.
        const textStart = this.caretToTextIndex(range.start);
        const textEnd = this.caretToTextIndex(range.end);

        // Remember if the selection is zero width.
        let zeroWidthSelection = textStart === textEnd;

        // Find all of the content in the node so we can construct a new format tree with the old content.
        const everythingButFormats = 
            this.getNodes().filter(n => !(n instanceof FormatNode)) as (TextNode | AtomNode<any>)[];

        // Check if all of the selected content has the requested format so we can toggle it if so.
        // It's already applied if we're deleting (in which case this doesn't apply) or all of the 
        // non-format nodes in the format already have this format.
        let checkIndex = 0;
        let editingEmptyNode = false;
        let alreadyApplied = false;
        
        if(format === undefined)
            alreadyApplied = true;        
        else
            everythingButFormats.forEach(node => {
                const parent = this.getParentOf(node);
                // If it's text, and the current position is in range of the selection, does the position contain the requested format?
                if(node instanceof TextNode && parent instanceof FormatNode) {
                    // If we're formatting an empty node we previously found, this node's formatting is irrelevant.
                    if(editingEmptyNode) {}
                    // If this node is empty but contains a zero-width selection, remember it, since this is the only node for which formats are relevant.
                    else if(node.getText().length === 0) {
                        if(checkIndex === textStart && zeroWidthSelection) {
                            editingEmptyNode = true;
                            alreadyApplied = parent.getFormats(this).includes(format);
                        }
                    }
                    // If this node has more than zero characters, the formatting is all applied if the selection contains the entirety of this node's text
                    // and this node's parent contains the formatting.
                    else {
                        const parentIsFormatted = parent.getFormats(this).includes(format);
                        const selectionContainsNode = (textStart >= checkIndex && textStart <= checkIndex + node.getLength()) || (textEnd >= checkIndex && textEnd <= checkIndex + node.getLength());
                        const nodeContainsSelection = textStart >= checkIndex && textEnd <= checkIndex + node.getLength();
                        checkIndex += node.getLength();
                        if(!editingEmptyNode) {
                            if(nodeContainsSelection)
                                alreadyApplied = parentIsFormatted;
                            else if(selectionContainsNode)
                                alreadyApplied = alreadyApplied && parentIsFormatted;
                        }
                    }
                }
                // Treat all non-text as containing the requested format.
                else return true;
            });

        // Reformat everything. The strategy is to step through each character, atom node, and metadata node in this format node
        // and create a new series of formats that preserve existing formatting while applying new formatting to the selection.
        let newFormat = new FormatNode("", []); // The current formatter we're adding to.
        let currentFormat = newFormat;
        let textIndex = 0;
        let currentText = ""; // The current text we've accumulated, inserted before each format change and at the end.
        let formattingEmptyNode = false;
        let emptyNode = undefined;

        function saveText() {
            if(currentText.length > 0) {
                // TODO Immutable
                currentFormat.withSegmentAppended(new TextNode(currentText));
                currentText = "";
            }
        }

        function inRange() {
            return textIndex >= Math.min(textStart, textEnd) && textIndex < Math.max(textStart, textEnd);
        }

        everythingButFormats.forEach(node => {
            const parent = this.getParentOf(node);
            if(node instanceof TextNode) {
                if(parent instanceof FormatNode) {
                    // Remember we found an empty node so that we don't insert an extra one later.
                    if(node.getText().length === 0) {
                        if(textIndex === textStart && zeroWidthSelection) {
                            formattingEmptyNode = true;
                        }
                    }
                    else {
                        // Process each character in the node, including the very last position.
                        for(let i = 0; i <= node.getText().length; i++) {

                            // Determine the desired format for this character. Start with the current formats
                            // and if we're in the selected range, adjust them accordingly based on the current formats 
                            // and the requested format. (If this is a range deletion, then we just stick with the existing formats).
                            let formatter = node.getFormat(this);
                            let desiredFormats = formatter ? formatter.getFormats(this) : [];
                            if( format !== undefined && 
                                ((textIndex === textStart && zeroWidthSelection) || inRange())) {
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
                            currentFormat.getFormats(newFormat).forEach(current => {
                                // If the current format is not in the desired list, close the text
                                // node and keep popping formats until we find the parent of the offending format.
                                if(!desiredFormats.includes(current)) {

                                    // Save any text that we've accumulated.
                                    saveText();

                                    // Not sure this loop is necessary; we should always remove in the order we added.
                                    while(currentFormat.#format !== current)
                                        currentFormat = currentFormat.getParent(newFormat) as FormatNode;
                                    currentFormat = currentFormat.getParent(newFormat) as FormatNode;

                                    // If we have unformatted something at a zero-width range, create empty format node, add a text node in it and remember it so
                                    // we can place the caret in it.
                                    if(!formattingEmptyNode && textIndex === textStart && zeroWidthSelection) {
                                        emptyNode = new TextNode("");
                                        // TODO Immutable
                                        currentFormat.withSegmentAppended(emptyNode);
                                        const newDesiredFormat = new FormatNode(current, []);
                                        // TODO Immutable
                                        currentFormat.withSegmentAppended(newDesiredFormat);
                                        currentFormat = newDesiredFormat;
                                    }

                                }
                            });

                            // Ensure the desired formats.
                            desiredFormats.forEach(desiredFormat => {
                                // If the current format does not yet include the desired format,
                                // close the text node and start a new format.
                                if(!currentFormat.getFormats(newFormat).includes(desiredFormat)) {

                                    // Save any text that we've accumulated.
                                    saveText();

                                    const newDesiredFormat = new FormatNode(desiredFormat, []);
                                    // TODO Immutable
                                    currentFormat.withSegmentAppended(newDesiredFormat);
                                    currentFormat = newDesiredFormat;

                                    // If we inserted an empty format node, add a text node in it and remember it so
                                    // we can place the caret in it.
                                    if(!formattingEmptyNode && textIndex === textStart && zeroWidthSelection) {
                                        emptyNode = new TextNode("");
                                        // TODO Immutable
                                        currentFormat.withSegmentAppended(emptyNode);
                                        currentFormat = newDesiredFormat.getParent(newFormat) as FormatNode;
                                    }

                                }
                            });

                            // If there's a format we're applying, or we're outside the deletion range, append the current text.
                            // We don't do this if we're checking the very last index of the node, since there is no character after it.
                            if(i < node.getLength()) {
                                if(format !== undefined || !inRange())
                                    currentText += node.getText().charAt(i);
                                textIndex++;
                            }
                        }

                    }
                }
                // Otherwise, handle a MetadataNode
                else if(parent instanceof MetadataNode) {
                    // Save whatever text came before it.
                    saveText();

                    // Process each character in the node, skipping any in bounds if we're deleting.
                    for(let i = 0; i < node.getText().length; i++) {
                        if(format !== undefined || !inRange())
                            currentText += node.getText().charAt(i);
                        textIndex++;
                    }

                    // Duplicate the MetadataNode but with new text. Erase the MetadataNode if the text is empty.
                    if(currentText.length > 0) {
                        const newMeta = parent.copy();
                        // TODO Immutable
                        newMeta.withText(currentText);
                        currentFormat.withSegmentAppended(newMeta);
                        currentText = "";
                    }
                }
            }
            // If it's an AtomNode, just add it unmodified, since we only format text.
            // unless it's in range of the deletion, in which case we delete it.
            else if(node instanceof AtomNode) {
                // Before adding the atom, create a text node and reset the accumulator.
                saveText();

                // Add the atom immediately after, unless it's in the deletion range.
                // We include both the start and end since AtomNode's text index is on both sides.
                if(format !== undefined || textIndex < Math.min(textStart, textEnd) || textIndex >= Math.max(textStart, textEnd))
                    currentFormat.withSegmentAppended(node);

                // Increment the text index, atoms count.
                textIndex++;
            }
        });

        // Save any remaining text that we've accumulated.
        saveText();

        // If it's empty, make sure there's one empty text node to type in.
        if(newFormat.getTextAndAtomNodes().length === 0)
            newFormat = newFormat.withSegmentAppended(new TextNode(""));

        return newFormat;

    }

    getFormats(root: Node): Format[] {

        let format: FormatNodeParent | undefined = this;
        const formats: Format[] = [];
        while(format instanceof FormatNode) {
            if(format.#format !== "")
                formats.push(format.#format);
            format = format.getParent(root);
        }
        return formats;

    }

    insertSegmentAt(segment: FormatNodeSegmentType, caret: Caret) : FormatNode | undefined {

        if(!(caret.node instanceof TextNode))
            return;

        // Verify that the caret's node is a segment in this node.
        const index = this.#segments.indexOf(caret.node);
        if(index < 0)
            return;

        // Splice the text node.
        const left = new TextNode(caret.node.getText().substring(0, caret.index));
        const right = new TextNode(caret.node.getText().substring(caret.index));

        // Insert the new left, right and middle
        return new FormatNode(this.#format, this.#segments.slice().splice(index, 1, left, segment, right));

    }

    getParentOf(node: Node): Node | undefined {
        return this.#segments.map(b => b === node ? this : b.getParentOf(node)).find(b => b !== undefined);
    }

    withoutContentBefore(caret: Caret): FormatNode | undefined {
        return this.withoutRange({ start: this.getFirstCaret(), end: caret });
    }

    withoutContentAfter(caret: Caret): FormatNode | undefined {
        return this.withoutRange({ start: caret, end: this.getLastCaret() });        
    }

    withSegmentsAppended(format: FormatNode): FormatNode {
        return new FormatNode(this.#format, [ ... this.#segments, ... format.getSegments() ]);
    }

}