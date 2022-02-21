import { Node } from "./Node";
import { ErrorNode } from "./ErrorNode";
import { TextNode } from "./TextNode";
import { BlockNode } from "./Parser";
import { FootnoteNode } from "./FootnoteNode";
import { LinkNode } from "./LinkNode";
import { EmbedNode } from "./EmbedNode";
import { InlineCodeNode } from "./InlineCodeNode";
import { CitationsNode } from "./CitationsNode";
import { DefinitionNode } from "./DefinitionNode";
import { CommentNode } from "./CommentNode";
import { LabelNode } from "./LabelNode";
import { Caret, CaretRange } from "./ChapterNode";

export type Format = "" | "*" | "_" | "" | "^" | "v";
export type FormattedNodeSegmentType = FormattedNode | TextNode | ErrorNode | InlineCodeNode | CitationsNode | FootnoteNode | DefinitionNode | LinkNode | CommentNode | LabelNode;
export type FormattedNodeParent = BlockNode | FormattedNode | FootnoteNode | LinkNode | EmbedNode | DefinitionNode;

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
        this.#segments = this.#segments.filter(item => item !== node)
        // If this now has no segments, remove it.
        if(this.#segments.length === 0)
            this.remove();
    }

    replaceChild(node: Node, replacement: FormattedNodeSegmentType): void {
        const index = this.#segments.indexOf(node as FormattedNodeSegmentType);
        if(index < 0) return;
        this.#segments[index] = replacement;
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
        const merged: FormattedNodeSegmentType[] = [];
        while(this.#segments.length > 0) {
            const next = this.#segments.shift() as FormattedNodeSegmentType;
            // If it's an empty text node, remove it.
            if(next instanceof TextNode) {
                if(next.getLength() > 0)
                    merged.push(next);
            }
            // If there's no last node or it isn't a formatting node or it is but a different format, just add the next node.
            else if(merged.length === 0 || (!(merged[merged.length - 1] instanceof FormattedNode)) || (next instanceof FormattedNode && (merged[merged.length - 1] as FormattedNode).#format !== next.#format)) {
                merged.push(next);
            }
            // Otherwise, add this node to the last node.
            else {
                const last = merged[merged.length - 1] as FormattedNode;
                const formatted = next as FormattedNode;
                formatted.#segments.forEach(n => { last.addSegment(n); });
            }
        }
        this.#segments = merged;
    }

    clean() {

        // Clean all of the segments.
        this.#segments.forEach(s => s.clean());

        // If this is empty, remove it.
        if(this.#segments.length === 0) { 
            this.remove();
            return;
        }
    
        // Merge any text, then merge redundant formats.
        this.mergeText();
        this.mergeFormats();

        // If this is in a format with the same format as its parent, move this node's segments to the parent to flatten it.
        const parent = this.getParent();
        if(parent instanceof FormattedNode && this.#format === parent.#format) {
            this.#segments.forEach(seg => seg.setParent(parent));
            const index = parent.#segments.indexOf(this);
            if(index < 0) throw Error("Uh oh, parentage is wrong.");
            parent.#segments = parent.#segments.slice(0, index).concat(this.#segments).concat(parent.#segments.slice(index + 1));
        }

    }

    getTextNodes(): TextNode[] {
        return this.getNodes().filter(n => n instanceof TextNode) as TextNode[];
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
        if(!formatted || !(formatted instanceof FormattedNode))
            throw Error("Can't format a caret range with nodes that don't have a common FormattedNode ancestor.");

        // Determine which text nodes do and don't have the requested formatting.
        // This determines what transformations we apply.
        const textNodes = this.getTextNodes();
        const selectedNodes = textNodes.filter(n => 
                // Only include the start and end node if we've selected 1 or more of their characters.
                // Otherwise, they will be counted as formatted or unformatted in the logic below,
                // preventing formatting removal.
                (n === startNode && range.start.index < startNode.getLength()) ||
                (n === endNode && range.end.index > 0) || 
                (textNodes.indexOf(n) > textNodes.indexOf(startNode) && textNodes.indexOf(n) < textNodes.indexOf(endNode))
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
                if(parent) {
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
                if(parent) {
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
                        // Update this node's parent.
                        node.setParent(formatter);
                        // Wrap the node in all the formats, if there are any.
                        nodeFormat.format.split("").forEach(formatToApply => {
                            // If the requested formatting is "", remove all formatting. If it's not, then
                            // only restore formatting if it's not the formatting we're removing.
                            if(nodeFormat.node !== middle || (format !== "" && formatToApply !== format)) {
                                node = new FormattedNode(formatter, formatToApply as Format, [ node ]);
                            }
                        })
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
        const newNodes: { node: FormattedNodeSegmentType, format: string}[] = [];
        nodes.forEach(node => {
            if(!(node instanceof FormattedNode)) {
                let format = "";
                let parent = node.getParent();
                while(parent) {
                    if(parent instanceof FormattedNode)
                        format = format + parent.#format;
                    parent = parent.getParent();
                }
                newNodes.push({ node: node as FormattedNodeSegmentType, format: format });
            }
        });
        return newNodes;

    }

}