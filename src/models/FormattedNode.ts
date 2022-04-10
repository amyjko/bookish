import { Node } from "./Node";
import { ErrorNode } from "./ErrorNode";
import { TextNode } from "./TextNode";
import { BlockNode } from "./BlockNode";
import { FootnoteNode } from "./FootnoteNode";
import { EmbedNode } from "./EmbedNode";
import { Caret, CaretRange } from "./Caret";
import { MetadataNode } from "./MetadataNode";
import { AtomNode } from "./AtomNode";

export type Format = "" | "*" | "_" | "" | "^" | "v";
export type FormattedNodeSegmentType = FormattedNode | TextNode | ErrorNode | MetadataNode<any> | AtomNode<any>;
export type FormattedNodeParent = BlockNode | FormattedNode | FootnoteNode | EmbedNode;

export class FormattedNode extends Node<FormattedNodeParent> {
    #format: Format;
    #segments: FormattedNodeSegmentType[];

    constructor(parent: FormattedNodeParent | undefined, format: Format, segments: FormattedNodeSegmentType[]) {
        super(parent, "formatted");
        this.#format = format;
        this.#segments = segments;
        // Make sure parents are assigned correctly.
        segments.forEach(seg => seg.setParent(this));
    }

    getFormat() { return this.#format; }
    getSegments() { return this.#segments; }
    setSegments(segs: FormattedNodeSegmentType[]) { this.#segments = segs; }
    isEmpty() { return this.#segments.length === 0; }
    getLength() { return this.#segments.length; }

    toText(): string {
        return this.#segments.map(segment => segment.toText()).join(" ");
    }

    toBookdown(): string {
        return (this.#format === "v" ? "^v" : this.#format) + this.#segments.map(s => s.toBookdown()).join("") + this.#format;
    }

    addSegment(node: FormattedNodeSegmentType) {
        node.setParent(this);
        this.#segments.push(node);
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
        return text[0] as TextNode;
    }

    getLastTextNode(): TextNode {
        const text = this.getTextNodes();
        return text[text.length - 1] as TextNode;
    }

    replaceChild(node: Node, replacement: FormattedNodeSegmentType): void {
        // Find the given node's index.
        const index = this.#segments.indexOf(node as FormattedNodeSegmentType);
        if(index < 0) return;
        // Replace it.
        replacement.setParent(this);
        this.#segments[index] = replacement;
        // Normalize the tree.
        this.clean();
    }

    getSiblingOf(child: Node, next: boolean) { return this.#segments[this.#segments.indexOf(child as FormattedNodeSegmentType) + (next ? 1 : -1)]; }

    copy(parent: FormattedNodeParent) {
        const node = new FormattedNode(parent, this.#format, []);
        this.#segments.forEach(s => node.addSegment(s.copy(node) as FormattedNodeSegmentType));
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
        const merged: FormattedNodeSegmentType[] = [];
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
                    if(previous instanceof FormattedNode && next instanceof FormattedNode && previous.getFormat() === next.getFormat()) {
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

    getFormattedRoot(): FormattedNode | undefined {
        return this.getFarthestParentMatching(p => p instanceof FormattedNode) as FormattedNode;
    }

    clean() {

        // Clean all of the segments bottom up first.
        this.#segments.forEach(s => s.clean());

        // If this is empty and it's not the root, remove it.
        if(this.#segments.length === 0 && this.getFormattedRoot() !== this) { 
            this.remove();
            return;
        }
    
        // Merge merge redundant formatted nodes
        this.mergeFormats();

        // If this is in a format with the same format as its parent, move this node's segments to the parent to flatten it.
        const parent = this.getParent();
        if(parent instanceof FormattedNode && this.getFormat() === parent.getFormat()) {
            this.#segments.forEach(seg => seg.setParent(parent));
            const index = parent.getSegments().indexOf(this);
            if(index < 0) throw Error("Uh oh, parentage is wrong.");
            parent.#segments = parent.getSegments().slice(0, index).concat(this.getSegments()).concat(parent.getSegments().slice(index + 1));
        }

    }

    getTextNodes(): TextNode[] {
        return this.getNodes().filter(n => n instanceof TextNode) as TextNode[];
    }

    getTextOrAtomNodes(): (TextNode | AtomNode<any>)[] {
        return this.getNodes().filter(n => n instanceof TextNode || n instanceof AtomNode) as (TextNode | AtomNode<any>)[];
    }

    getNextTextOrAtom(node: TextNode | AtomNode<any>): TextNode | AtomNode<any> | undefined {
        // Otherwise, find the next text node after this one.
        const text = this.getTextOrAtomNodes();
        const index = text.indexOf(node);
        return index === undefined ? undefined :
            index < text.length - 1 ? text[index + 1] :
            undefined;
    }

    getPreviousTextOrAtom(node: TextNode | AtomNode<any>): TextNode | AtomNode<any> | undefined {
        // Otherwise, find the next text node after this one.
        const text = this.getTextOrAtomNodes();
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
    split(caret: Caret): FormattedNode[] | undefined {

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

        // This only transforms ranges that start and end with text nodes.
        if(!(range.start.node instanceof TextNode))
           return range;
        if(!(range.end.node instanceof TextNode)) 
            return range;

        const startNode = range.start.node;
        const endNode = range.end.node;

        // Cases to handle. Examples below are for * formatting. [] means no formatting. | means caret.
        // A.  [This is my para|graph to format.]      -> [This is my para][*|*][graph to format.]   # Unformatted, no selection -> insert FormattedNode
        // B.  [This is my ]*para|graph*[ to format.]  -> [This is my ]*para*[|]*graph*[ to format.] # Formatted, no selection -> split FormattedNode and insert unformatted node
        // C.  [This is my |paragraph| to format.]     -> [This is my ]*|paragraph|*[ to format.]    # Selection -> wrap selection in FormattedNode
        // D.  [This is my ]*|paragraph|*[ to format.] -> [This is my |paragraph| to format.]        # Fully formatted -> remove formatting
        // E.  [This is my |para]*graph*[| to format.] -> [This is my ]*|paragraph|*[ to format.]    # Partially formatted -> extend selection
        // F.  [This is my |para]*graph| to format*[.] -> [This is my ]*|paragraph| to format*[.]    # Partially formatted -> extend selection

        // The algorithm:
        // ✓ - Remember the text positions of the current range.
        // - Identify needs
        //    ✓ 1. Identify all text nodes in the selection that are and are not formatted.
        //    ✓ 2. Create an empty set of text to format.
        //    ✓ 3. If some nodes aren't formatted, add all unformatted nodes to the set and prepare to format; otherwise add all formatted ranges and unformat.
        // - For each range:
        //    1. Split the range's common ancestor's segments into beginning, middle, and end FormattedNodes [xxxx][][xxxx]
        //    2. Set the new middle node's formatting to the opposite of what it was
        //    3. Paste the middle segments into the new middle FormattedNode  [xxxx][...][xxxx]
        // - Clean up:
        //    1. Remove empty formatting (unless a new empty text node was created)
        //    1. Merge adjacent formatting
        //    2. Remove unformatted parents that have no effect
        // - Position:
        //    ✓ 1. Return a CaretRange that corresponds to the original positions

        // Convert the range into text positions so we can return a proper caret range.
        const textStart = this.caretToTextIndex(range.start);
        const textEnd = this.caretToTextIndex(range.end);

        // Verify that the two given nodes share a FormattedNode ancestor.
        const formatted = range.start.node.getCommonAncestor(range.end.node);
        // If they don't, no op.
        if(!formatted || !(formatted instanceof FormattedNode))
            return range;

        // Determine which text nodes do and don't have the requested formatting.
        // This determines what transformations we apply.
        const textNodes = this.getTextNodes();
        const selectedNodes = textNodes.filter(n => 
                // Exclude any text nodes not parented by a formatted node (e.g., atomic nodes like links).
                n.getParent() instanceof FormattedNode &&
                (
                    // Only include the start and end node if we've selected 1 or more of their characters.
                    // Otherwise, they will be counted as formatted or unformatted in the logic below,
                    // preventing formatting removal.
                    (n === startNode && range.start.index < startNode.getLength()) ||
                    (n === endNode && range.end.index > 0) || 
                    // Include any nodes between the start and the end nodes.
                    (textNodes.indexOf(n) > textNodes.indexOf(startNode) && textNodes.indexOf(n) < textNodes.indexOf(endNode))
                )
        );

        // Split the nodes into formatted and unformatted so that we can operate on one or the other sets.
        const formattedNodes = new Set(selectedNodes.filter(n => n.getClosestParentMatching(p => p instanceof FormattedNode && p.#format === format) !== undefined));
        const unformattedNodes = new Set(selectedNodes.filter(n => !formattedNodes.has(n)));

        // If *any* nodes are unformatted, apply the formatting to all unformatted nodes.
        const apply = unformattedNodes.size > 0;
        const nodesToFormat = apply ? unformattedNodes : formattedNodes;

        const insertingEmptyTextNode = textStart === textEnd;
        let newEmptyTextNode = undefined;

        // Format each node accordingly.
        nodesToFormat.forEach(text => {

            // If we're applying formatting, split this text node into left, middle, and right, and wrap the middle in the new formatting.
            // Account for selection's start and end index.
            // Don't worry about empty text nodes, we'll clean those up later.
            if(apply) {
                const parent = text.getParent();
                if(parent instanceof FormattedNode) {
                    const formattedMiddle = new FormattedNode(parent, format, []);
                    const left = new TextNode(parent, text.getText().substring(0, text === range.start.node ? range.start.index : 0), 0);
                    const middle = new TextNode(formattedMiddle, text.getText().substring(text === range.start.node ? range.start.index : 0, text === range.end.node ? range.end.index : text.getLength()), 0);
                    const right = new TextNode(parent, text.getText().substring(text === range.end.node ? range.end.index : text.getLength()), 0);
                    formattedMiddle.addSegment(middle);
                    parent.#segments.splice(parent.#segments.indexOf(text), 1, left, formattedMiddle, right);

                    // Remember the new empty text node
                    if(insertingEmptyTextNode)
                        newEmptyTextNode = middle;
                }
            } 
            // If we're removing formatting, remove and reapply formatting, except for the formatting to be removed from the selected node.
            //   1. Split the text node at the selection so that it can be formatted differently.
            //   2. Remember the formatting on all nodes, in order.
            //   3. Create a new list of nodes, wrap each according to their original formatting, except the selected node, from which we exclude the formatting being removed.
            // For example:
            //   1. •I think •*•broadening participation in •_•com|put|ing•_*• is cool.•
            //   2. •I think •*•broadening participation in •_•com•|•put•|•ing•_*• is cool.•
            //   3. •I think ••broadening participation in ••com•|•put•|•ing•• is cool.•
            else {

                // 1. Split the text node along the selection
                const parent = text.getParent();
                if(parent instanceof FormattedNode) {
                    const left = new TextNode(parent, text.getText().substring(0, text === range.start.node ? range.start.index : 0), 0);
                    const middle = new TextNode(parent, text.getText().substring(text === range.start.node ? range.start.index : 0, text === range.end.node ? range.end.index : text.getLength()), 0);
                    const right = new TextNode(parent, text.getText().substring(text === range.end.node ? range.end.index : text.getLength()), 0);
                    parent.#segments.splice(parent.#segments.indexOf(text), 1, left, middle, right);

                    // Remember the new empty text node
                    if(insertingEmptyTextNode)
                        newEmptyTextNode = middle;

                    // 2a. Find the formatter to remove
                    const formatter = text.getClosestParentMatching(p => p instanceof FormattedNode && p.#format === format) as FormattedNode;
                    if(formatter === undefined) throw Error(`Somehow couldn't find a parent with format ${format}`);

                    // 2b. Get the nodes, in render order, and the formats applied to them.
                    const formatting = formatter.getSegmentFormats();
                    
                    // 3. Add all of the nodes 
                    formatter.#segments = formatting.map(nodeFormat => {
                        let node = nodeFormat.node;
                        if(nodeFormat.format !== undefined) {
                            // Wrap the node in all the formats, if there are any.
                            nodeFormat.format.split("").forEach(formatToApply => {
                                // If the requested formatting is "", remove all formatting. If it's not, then
                                // only restore formatting if it's not the formatting we're removing.
                                if(node !== middle || (format !== "" && formatToApply !== format)) {
                                    node = new FormattedNode(formatter, formatToApply as Format, [ node ]);
                                }
                            })
                        }
                        // Make sure all children have the formatter as parent.
                        node.setParent(formatter);
                        return node;
                    });

                    // 3b. Remove the format from the formatter.
                    formatter.#format = "";
                }

            }

        });

        // Clean all of the formatting in this node, removing empty text and formatting nodes, 
        // merging text and formatting nodes, and ridding of formatting containers that don't do any formatting.
        // This ensures the simplest possible tree for later formatting, improving performance
        // and beautifying any markup we save elsewhere.
        // HOWEVER: We don't do this if we were inserting a formatting node at a single caret position, 
        // so that we can insert text into that new formatting node.
        if(newEmptyTextNode === undefined) {

            this.clean();

            // Convert the text selection back into a CaretRange, keeping selection on the same text.
            const startCaret = this.textIndexToCaret(textStart);
            const endCaret = this.textIndexToCaret(textEnd);
            if(startCaret && endCaret)
                return { start: startCaret, end: endCaret };

        } else {
            const caret = { node: newEmptyTextNode, index: 0 };
            return { start: caret, end: caret};
        }
        
        // This shouldn't ever happen unless something's gone horribly wrong and mutated the AST in a way that didn't preserve text.
        throw Error("Couldn't map text positions back to nodes, something's wrong :(");

    }

    getSegmentFormats() {

        const nodes = this.getNodes();
        const newNodes: { node: FormattedNodeSegmentType, format: string | undefined}[] = [];
        nodes.forEach(node => {
            // If this is a formatting node, a text node inside of an metadata node, or an Atom node, ignore it.
            if(node instanceof FormattedNode || node instanceof AtomNode || node.getClosestParentMatching(p => p instanceof MetadataNode) !== undefined) {
                // Do nothing. This strips the formatted nodes and leaves any text nodes to be included by their parents.
            }
            // If this is a text node inside of a formatting node, remember its formatting.
            else if(node instanceof TextNode && node.getParent() instanceof FormattedNode) {
                let format = "";
                let parent = node.getParent() as FormattedNode;
                while(parent) {
                    if(parent instanceof FormattedNode)
                        format = format + parent.#format;
                    parent = parent.getParent() as FormattedNode;
                }
                newNodes.push({ node: node as FormattedNodeSegmentType, format: format });
            }
            // Otherwise, if this doesn't have a add whatever node this is without formatting.
            else
                newNodes.push({ node: node as FormattedNodeSegmentType, format: undefined });
        });
        return newNodes;

    }

    insertSegmentAt(segment: FormattedNodeSegmentType, caret: Caret) : Caret {

        if(!(caret.node instanceof TextNode))
            return caret;

        // Verify that the caret's node is a segment in this node.
        const index = this.#segments.indexOf(caret.node);
        if(index < 0)
            return caret;

        // Splice the text node.
        const left = new TextNode(this, caret.node.getText().substring(0, caret.index), 0);
        const right = new TextNode(this, caret.node.getText().substring(caret.index), 0);

        // Insert the new left, right and middle
        this.#segments.splice(index, 1, left, segment, right);

        // Return the first index in the new node's text node.
        return { node: segment, index: 0 };

    }

}