import { Node } from "./Node";
import { ErrorNode } from "./ErrorNode";
import { TextNode } from "./TextNode";
import { BlockNode } from "./BlockNode";
import { FootnoteNode } from "./FootnoteNode";
import { EmbedNode } from "./EmbedNode";
import { Caret, CaretRange } from "./Caret";
import { MetadataNode } from "./MetadataNode";
import { AtomNode } from "./AtomNode";
import { ListNode } from "./ListNode";
import { TableNode } from "./TableNode";
import { Edit } from "./Edit";

export type Format = "" | "*" | "_" | "^" | "v";
export type FormatNodeSegmentType = FormatNode | TextNode | ErrorNode | MetadataNode<any> | AtomNode<any>;
export type FormatNodeParent = BlockNode | FormatNode | FootnoteNode | EmbedNode | ListNode | TableNode | undefined;

export class FormatNode extends Node {
    
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
    getParentOf(node: Node): Node | undefined {
        return this.#segments.map(b => b === node ? this : b.getParentOf(node)).find(b => b !== undefined);
    }

    toText(): string {
        return this.#segments.map(segment => segment.toText()).join(" ");
    }

    toBookdown(debug?: number): string {
        return (this.#format === "v" ? "^v" : this.#format) + this.#segments.map(s => s instanceof AtomNode ? s.toBookdown(debug, this) : s.toBookdown(debug)).join("") + this.#format;
    }

    getChildren() { return this.#segments; }

    getFirstTextNode(): TextNode {
        const text = this.getTextNodes();
        return text[0];
    }

    getLastTextNode(): TextNode {
        const text = this.getTextNodes();
        return text[text.length - 1];
    }

    copy(): this {
        return new FormatNode(this.#format, this.#segments.map(s => s.copy())) as this;
    }

    getTextNodes(): TextNode[] {
        return this.getNodes().filter(n => n instanceof TextNode) as TextNode[];
    }

    getTextAndAtomNodes(): (TextNode | AtomNode<any>)[] {
        return this.getNodes().filter(n => n instanceof TextNode || n instanceof AtomNode) as (TextNode | AtomNode<any>)[];
    }

    getAdjacentTextOrAtom(node: TextNode | AtomNode<any>, next: boolean): TextNode | AtomNode<any> | undefined {
        const text = this.getTextAndAtomNodes();
        const index = text.indexOf(node);
        return index === undefined ? undefined :
            (next ? 
                (index >= 0 && index < text.length - 1 ? text[index + 1] : undefined) : 
                (index > 0 && index <= text.length ? text[index - 1] : undefined));
    }

    getNextTextOrAtom(node: TextNode | AtomNode<any>): TextNode | AtomNode<any> | undefined {
        return this.getAdjacentTextOrAtom(node, true);
    }

    getPreviousTextOrAtom(node: TextNode | AtomNode<any>): TextNode | AtomNode<any> | undefined {
        return this.getAdjacentTextOrAtom(node, false);
    }

    getAdjacentCaret(caret: Caret, next: boolean): Caret | undefined {
        if(!(caret.node instanceof TextNode) && !(caret.node instanceof AtomNode)) return;
        // Is there an adjascent caret in the current text node? If so, return it.
        if(caret.node instanceof TextNode) {
            const adjacentText = next ? caret.node.getNextCaret(caret.index) : caret.node.getPreviousCaret(caret.index);
            if(adjacentText !== undefined) return adjacentText;
        }
        // If there's not, is there an adjascent caret in the sequence of text and atom nodes?
        const adjacentNode = this.getAdjacentTextOrAtom(caret.node, next);
        if(adjacentNode !== undefined)
            return { node: adjacentNode, index: !next && adjacentNode instanceof TextNode ? adjacentNode.getLength() - 1 : 0 }
        // Otherwise, there is no adjascent caret.
        return undefined;
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

    withSegmentAppended(segment: FormatNodeSegmentType): FormatNode {
        return new FormatNode(this.#format, [ ...this.#segments, segment ]);
    }

    withSegmentReplaced(segment: FormatNodeSegmentType, replacement: FormatNodeSegmentType): this | undefined {

        const index = this.#segments.indexOf(segment);
        if(index < 0) return undefined;

        const segments = this.#segments.slice();
        segments[index] = replacement;

        return new FormatNode(this.#format, segments) as this;

    }

    withoutSegment(segment: FormatNodeSegmentType): this | undefined {

        const index = this.#segments.indexOf(segment);
        if(index < 0) return undefined;
        const newSegments = this.#segments.slice();
        newSegments.splice(index, 1);
        return new FormatNode(this.#format, newSegments) as this;

    }

    withChildReplaced(node: FormatNodeSegmentType, replacement: FormatNodeSegmentType | undefined) {
        return replacement === undefined ? 
            this.withoutSegment(node) as this : 
            this.withSegmentReplaced(node, replacement) as this;
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

        // Compute the equivalent caret for each
        // Find what index this node is in the paragraph so we can find its doppleganger in the copy.
        const firstCaret = { node: this.getTextNodes()[nodeIndex], index: caret.index };
        const secondCaret = { node: this.getTextNodes()[nodeIndex], index: caret.index };

        // Delete everything after in the first, everything before in the second.
        const first = this.withoutRange({ start: firstCaret, end: this.getLastCaret() });
        const second = this.withoutRange({ start: this.getFirstCaret(), end: secondCaret });

        if(first !== undefined && second !== undefined)
            return [first, second];

    }

    withoutRange(range: CaretRange): FormatNode | undefined {
        return this.withFormat(range, undefined);
    }

    // This function takes the given range, and if it's within the bounds of this FormatNode,
    // produces a new FormatNode that either formats the given range with the given format or deletes the range if the format is undefined.
    // It's approach is to scan through every text, meta, and atom node build a new format based on the requested format.
    withFormat(range: CaretRange, format: Format | undefined): FormatNode | undefined {

        // This only transforms ranges that start and end with text/atom nodes in this format node.
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
            this.getNodes().filter(n => !(n instanceof FormatNode));

        // Check if all of the selected content has the requested format so we can toggle it if so.
        let checkIndex = 0; // This tracks the current location in our scan.
        let editingEmptyNode = false; // This remembers the special case of the caret being inside an empty text node.
        let alreadyApplied = false; // We assume it's not applied until proven otherwise.
        
        // It's already applied if we're deleting (in which case this doesn't apply).
        if(format === undefined)
            alreadyApplied = true;        
        // Otherwise, formatting is already applied if all of the non-format nodes already have this format.
        // We need to know this so we can toggle the format off.
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
        let newFormats: { format: Format, segments: FormatNodeSegmentType[] }[] = [ { format: "", segments: [] } ]; // A stack of formats we're constructing.
        let textIndex = 0;
        let currentText = ""; // The current text we've accumulated, inserted before each format change and at the end.
        let formattingEmptyNode = false;
        let emptyNode = undefined;

        function saveText() {
            // If there's some text, update the current format with the current text, then reset it.
            if(currentText.length > 0) {
                newFormats[0].segments.push(new TextNode(currentText));
                currentText = "";
            }
        }

        function inRange() {
            return textIndex >= Math.min(textStart, textEnd) && textIndex < Math.max(textStart, textEnd);
        }

        function getFormats() {
            // We don't include non-formatted text in the list of formats applied.
            return newFormats.map(f => f.format).filter(f => f !== "");
        }

        function finishFormat() {
            const formatSpec = newFormats[0];
            newFormats.shift();
            // Keep it clean by only adding the format node if it's not empty.
            if(formatSpec.segments.length > 0)
                newFormats[0].segments.push(new FormatNode(formatSpec.format, formatSpec.segments));
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
                            getFormats().forEach(activeFormat => {
                                // If the current format is not in the desired list, close the text
                                // node and keep popping formats until we find the parent of the offending format.
                                if(!desiredFormats.includes(activeFormat)) {

                                    // Save any text that we've accumulated.
                                    saveText();

                                    // Not sure this loop is necessary; we should always remove in the order we added.
                                    while(newFormats[0].format !== activeFormat)
                                        finishFormat();
                                    // Do it one more time to close out the undesired format.
                                    finishFormat();

                                    // If we have unformatted something at a zero-width range, create empty format node, add a text node in it and remember it so
                                    // we can place the caret in it.
                                    if(!formattingEmptyNode && textIndex === textStart && zeroWidthSelection) {
                                        // Remember the node for later, so we can place the caret in it.
                                        emptyNode = new TextNode("");
                                        // Append the empty node to the current format.
                                        newFormats[0].segments.push(emptyNode);
                                        // Push a new format onto the stack to start adding to.
                                        newFormats.unshift({ format: activeFormat, segments: [] });
                                    }

                                }
                            });

                            // Ensure the desired formats.
                            desiredFormats.forEach(desiredFormat => {
                                // If the current format does not yet include the desired format,
                                // close the text node and start a new format.
                                if(!getFormats().includes(desiredFormat)) {

                                    // Save any text that we've accumulated in the curent format.
                                    saveText();

                                    // Add a new format onto the stack to start adding to.
                                    newFormats.unshift({ format: desiredFormat, segments: [] });

                                    // If we inserted an empty format node, add a text node in it and remember it so
                                    // we can place the caret in it.
                                    if(!formattingEmptyNode && textIndex === textStart && zeroWidthSelection) {
                                        emptyNode = new TextNode("");
                                        newFormats[0].segments.push(emptyNode);
                                        finishFormat();
                                    }
                                }
                            });

                            // If there's a format we're applying, or we're outside the deletion range, append the current character.
                            // We don't do this if we're checking the very last index of the node, since there is no character after it.
                            if(i < node.getLength()) {
                                if(format !== undefined || !inRange())
                                    currentText += node.getText().charAt(i);
                                textIndex++;
                            }
                        }
                    }
                }
                // If the parent is a MetadataNode
                else if(parent instanceof MetadataNode) {
                    // Save whatever text came before it.
                    saveText();

                    // Process each character in the node if we're formatting, and if we're deleting, skip anything in range of deletion.
                    for(let i = 0; i < node.getText().length; i++) {
                        if(format !== undefined || !inRange())
                            currentText += node.getText().charAt(i);
                        textIndex++;
                    }

                    // Duplicate the MetadataNode but with new text. Erase the MetadataNode if the text is empty
                    // by simply not adding one to this new format. Then, erase the text, since it was added in the metadata node.
                    if(currentText.length > 0) {
                        newFormats[0].segments.push(parent.withText(new TextNode(currentText)));
                        currentText = "";
                    }
                }
            }
            // If it's an AtomNode, just add it unmodified, since we only format text.
            // But if it's it's in range of the deletion, skip it, since we're deleting.
            else if(node instanceof AtomNode) {
                // Before adding the atom, create a text node and reset the accumulator.
                saveText();

                // Add the atom immediately after, unless it's in the deletion range.
                // We include the start indexx  since AtomNode's text index is on the left.
                if(format !== undefined || (textIndex <= Math.min(textStart, textEnd) || textIndex > Math.max(textStart, textEnd)))
                    newFormats[0].segments.push(node);

                // Increment the text index; atoms count for one character.
                textIndex++;
            }
        });

        // Save any remaining text that we've accumulated.
        saveText();

        // Keep finishing formats until we get to the original we created.
        while(newFormats.length > 1)
            finishFormat();

        // Create the final format.
        const newFormat = new FormatNode(newFormats[0].format, newFormats[0].segments);

        // If after all that, it's empty, make sure there's one empty text node to type in.
        if(newFormat.getTextAndAtomNodes().length === 0)
            return new FormatNode("", [ new TextNode("") ]);

        // Return the newly formatted (or edited) format node!
        return newFormat;

    }

    getFormats(root: Node): Format[] {

        let format: FormatNodeParent | undefined = this;
        const formats: Format[] = [];
        while(format instanceof FormatNode) {
            if(format.#format !== "")
                formats.push(format.#format);
            format = format.getParent(root) as FormatNodeParent;
        }
        return formats;

    }

    withSegmentAt(segment: FormatNodeSegmentType, caret: Caret) : FormatNode | undefined {

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
        const newSegments = this.#segments.slice();
        newSegments.splice(index, 1, left, segment, right);
        return new FormatNode(this.#format, newSegments);

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

    withoutCharacter(caret: Caret, next: boolean): Edit | undefined {
        // Confirm that this caret is in this format.
        if(!this.contains(caret.node)) return;
        // Is there an adjascent caret? Return nothing if not.
        const adjacentCaret = this.getAdjacentCaret(caret, next);
        if(adjacentCaret === undefined) return;
        // If next, keep the caret in place, otherwise go to the adjacent caret position.
        const textIndex = this.caretToTextIndex(next ? caret : adjacentCaret);
        // If there is one, try removing everything between this and the adjascent caret.
        const newFormat = this.withoutRange({ start: caret, end: adjacentCaret });
        const newCaret = newFormat?.textIndexToCaret(textIndex);
        if(newFormat === undefined || newCaret === undefined) return;
        return { root: newFormat, range: { start: newCaret, end: newCaret } };
    }

}