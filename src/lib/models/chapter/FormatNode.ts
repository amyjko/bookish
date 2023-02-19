import Node from './Node';
import type ErrorNode from './ErrorNode';
import TextNode from './TextNode';
import type Caret from './Caret';
import {
    caretRangeToIndexRange,
    caretToIndex,
    indexToCaret,
    type CaretRange,
} from './Caret';
import MetadataNode from './MetadataNode';
import AtomNode from './AtomNode';
import type Edit from './Edit';

export type Format = '' | '*' | '_' | '^' | 'v';
export type FormatNodeSegmentType =
    | FormatNode
    | TextNode
    | ErrorNode
    | MetadataNode<any>
    | AtomNode<any>;

export default class FormatNode extends Node {
    readonly #format: Format;
    readonly #segments: FormatNodeSegmentType[];

    constructor(format: Format, segments: FormatNodeSegmentType[]) {
        super();

        this.#format = format;
        // Remove consecutive empty text nodes.
        this.#segments = segments.filter((item, position, list) => {
            if (
                position === 0 ||
                !(item instanceof TextNode) ||
                item.getLength() > 0
            )
                return true;
            const previous = list[position - 1];
            return !(
                previous instanceof TextNode && previous.getLength() === 0
            );
        });
    }

    getType() {
        return 'formatted';
    }
    getFormat() {
        return this.#format;
    }
    getSegments() {
        return this.#segments;
    }
    isEmpty() {
        return this.#segments.length === 0;
    }
    isEmptyText() {
        return (
            this.#segments.length === 1 &&
            this.#segments[0] instanceof TextNode &&
            this.#segments[0].getText() === ''
        );
    }
    getLength() {
        return this.#segments.length;
    }
    getParentOf(node: Node): Node | undefined {
        return this.#segments
            .map((b) => (b === node ? this : b.getParentOf(node)))
            .find((b) => b !== undefined);
    }

    toText(): string {
        return this.#segments.map((segment) => segment.toText()).join(' ');
    }
    toHTML(): string {
        const format = this.#format;
        const segments = this.#segments.map((s) => s.toHTML()).join('');
        if (format === '*') return `<strong>${segments}</strong>`;
        else if (format === '_') return `<em>${segments}</em>`;
        else if (format === '^') return `<sup>${segments}</sup>`;
        else if (format === 'v') return `<sub>${segments}</sub>`;
        else return segments;
    }

    toBookdown(): string {
        return (
            (this.#format === 'v' ? '^v' : this.#format) +
            this.#segments
                .map((s) =>
                    s instanceof AtomNode ? s.toBookdown(this) : s.toBookdown()
                )
                .join('') +
            (this.#format === 'v' ? '^' : this.#format)
        );
    }

    getChildren() {
        return this.#segments;
    }

    getFirstTextNode(): TextNode {
        const text = this.getTextNodes();
        return text[0];
    }

    getLastTextNode(): TextNode {
        const text = this.getTextNodes();
        return text[text.length - 1];
    }

    copy(): this {
        return new FormatNode(
            this.#format,
            this.#segments.map((s) => s.copy())
        ) as this;
    }

    getTextNodes(): TextNode[] {
        return this.getNodes().filter(
            (n) => n instanceof TextNode
        ) as TextNode[];
    }

    // Get all text or atom nodes in this format, except for any inside an atom node,
    // as this is used for navigation and editing, and they should be isolated from that.
    getTextAndAtomNodes(): (TextNode | AtomNode<any>)[] {
        return this.getNodes().filter(
            (n) => n instanceof TextNode || n instanceof AtomNode
        ) as (TextNode | AtomNode<any>)[];
    }

    getAdjacentTextOrAtom(
        node: TextNode | AtomNode<any>,
        next: boolean
    ): TextNode | AtomNode<any> | undefined {
        // Find all of the text and atom nodes not in atom nodes in this node.
        const text = this.getTextAndAtomNodes();
        const index = text.indexOf(node);
        return index === undefined
            ? undefined
            : next
            ? index >= 0 && index < text.length - 1
                ? text[index + 1]
                : undefined
            : index > 0 && index <= text.length
            ? text[index - 1]
            : undefined;
    }

    getNextTextOrAtom(
        node: TextNode | AtomNode<any>
    ): TextNode | AtomNode<any> | undefined {
        return this.getAdjacentTextOrAtom(node, true);
    }

    getPreviousTextOrAtom(
        node: TextNode | AtomNode<any>
    ): TextNode | AtomNode<any> | undefined {
        return this.getAdjacentTextOrAtom(node, false);
    }

    getAdjacentCaret(caret: Caret, next: boolean): Caret | undefined {
        if (
            !(caret.node instanceof TextNode) &&
            !(caret.node instanceof AtomNode)
        )
            return;
        // Is there an adjascent caret in the current text node? If so, return it.
        if (caret.node instanceof TextNode) {
            const adjacentText = next
                ? caret.node.getNextCaret(caret.index)
                : caret.node.getPreviousCaret(caret.index);
            if (adjacentText !== undefined) return adjacentText;
        }
        // If there's not, is there an adjacent caret in the sequence of text and atom nodes?
        const adjacentNode = this.getAdjacentTextOrAtom(caret.node, next);
        if (adjacentNode !== undefined) {
            // Normally we skip over node boundaries because they look identical to each other.
            // But some nodes are zero length, so we have to account for that.
            return {
                node: adjacentNode,
                index: next
                    ? adjacentNode instanceof TextNode
                        ? adjacentNode.isEmpty()
                            ? 0
                            : 1
                        : 0
                    : adjacentNode instanceof TextNode
                    ? adjacentNode.isEmpty()
                        ? 0
                        : adjacentNode.getLength() - 1
                    : 0,
            };
        }
        // Otherwise, there is no adjascent caret.
        return undefined;
    }

    getFirstCaret(): Caret | undefined {
        const text = this.getTextNodes();
        if (text.length === 0) return undefined;
        return { node: this.getTextNodes()[0], index: 0 };
    }

    getLastCaret(): Caret | undefined {
        const text = this.getTextNodes();
        if (text.length === 0) return undefined;
        const last = text[text.length - 1];
        return { node: last, index: last.getLength() };
    }

    getSelection(): CaretRange {
        const first = this.getFirstTextNode();
        const last = this.getLastTextNode();
        return {
            start: { node: first, index: 0 },
            end: { node: last, index: last.getLength() },
        };
    }

    getIndexOfTextNode(node: TextNode): number | undefined {
        const text = this.getTextNodes();
        return text.indexOf(node);
    }

    getSelectedText(range: CaretRange): string | undefined {
        if (
            !(range.start.node instanceof TextNode) ||
            !(range.end.node instanceof TextNode)
        )
            return undefined;

        const start = this.getIndexOfTextNode(range.start.node);
        const end = this.getIndexOfTextNode(range.end.node);

        if (start === undefined || end === undefined) return undefined;

        return this.getTextNodes()
            .map((current, index) => {
                return current === range.start.node
                    ? current === range.end.node
                        ? current
                              .getText()
                              .substring(range.start.index, range.end.index)
                        : current.getText().substring(range.start.index)
                    : index > start && index < end
                    ? current.getText()
                    : current === range.end.node
                    ? current.getText().substring(0, range.end.index)
                    : '';
            })
            .join('');
    }

    withTextIfEmpty() {
        return this.isEmpty() ? this.withSegmentAppended(new TextNode()) : this;
    }

    withSegmentPrepended(segment: FormatNodeSegmentType): FormatNode {
        return new FormatNode(this.#format, [segment, ...this.#segments]);
    }

    withSegmentAppended(segment: FormatNodeSegmentType): FormatNode {
        return new FormatNode(this.#format, [...this.#segments, segment]);
    }

    withSegmentReplaced(
        segment: FormatNodeSegmentType,
        replacement: FormatNodeSegmentType
    ): this | undefined {
        const index = this.#segments.indexOf(segment);
        if (index < 0) return undefined;

        const segments = this.#segments.slice();
        segments[index] = replacement;

        return new FormatNode(this.#format, segments) as this;
    }

    withoutSegment(segment: FormatNodeSegmentType): this | undefined {
        const index = this.#segments.indexOf(segment);
        if (index < 0) return undefined;
        const newSegments = this.#segments.slice();
        newSegments.splice(index, 1);
        return new FormatNode(this.#format, newSegments) as this;
    }

    withChildReplaced(
        node: FormatNodeSegmentType,
        replacement: FormatNodeSegmentType | undefined
    ) {
        return replacement === undefined
            ? (this.withoutSegment(node) as this)
            : (this.withSegmentReplaced(node, replacement) as this);
    }

    // Creates two formatted nodes that split this node at the given caret location.
    split(caret: Caret): [FormatNode, FormatNode] | undefined {
        // We can only copy if
        // ... this has a parent.
        // ... the given caret is in this formatted node.
        // ... the caret is on a text node.
        if (!(caret.node instanceof TextNode) || !this.contains(caret.node))
            return undefined;

        const firstCaret = this.getFirstCaret();
        const lastCaret = this.getLastCaret();
        if (firstCaret === undefined || lastCaret === undefined)
            return undefined;

        // Delete everything after in the first, everything before in the second.
        const first = this.withoutRange({ start: caret, end: lastCaret });
        const second = this.withoutRange({ start: firstCaret, end: caret });

        if (first !== undefined && second !== undefined) return [first, second];
    }

    withoutRange(range: CaretRange): FormatNode | undefined {
        return this.withFormat(range, undefined);
    }

    // This function takes the given range, and if it's within the bounds of this FormatNode,
    // produces a new FormatNode that either formats the given range with the given format or deletes the range if the format is undefined.
    // It's approach is to scan through every text, meta, and atom node build a new format based on the requested format.
    withFormat(
        range: CaretRange,
        format: Format | undefined
    ): FormatNode | undefined {
        // This only transforms ranges that start and end with text/atom nodes in this format node.
        if (
            !(
                range.start.node instanceof TextNode ||
                range.start.node instanceof AtomNode
            ) ||
            !(
                range.end.node instanceof TextNode ||
                range.end.node instanceof AtomNode
            ) ||
            !(this.contains(range.start.node) && this.contains(range.end.node))
        )
            return;

        const sortedRange = this.sortRange(range);

        // Remember the text positions so we can return a new range in the new tree.
        const selectionStartIndex = caretToIndex(this, sortedRange.start);
        const selectionEndIndex = caretToIndex(this, sortedRange.end);

        if (
            selectionStartIndex === undefined ||
            selectionEndIndex === undefined
        )
            return;

        // Remember if the selection is zero width.
        let zeroWidthSelection = selectionStartIndex === selectionEndIndex;

        // Find all of the content in the node, except for format nodes and decendants of atom nodes that have format nodes,
        // to construct a new format tree with the old content.
        const everythingButFormats = this.getNodes().filter(
            (n) => !(n instanceof FormatNode)
        );

        // Check if all of the selected content has the requested format so we can toggle it if so.
        let checkIndex = 0; // This tracks the current location in our scan.
        let editingEmptyNode = false; // This remembers the special case of the caret being inside an empty text node.
        let alreadyApplied = false; // We assume it's not applied until proven otherwise.
        let nodeCount = 0;
        let nodesWithFormat = 0;

        // It's already applied if we're deleting (in which case this doesn't apply).
        if (format === undefined) alreadyApplied = true;
        // Otherwise, formatting is already applied if all of the non-format nodes already have this format.
        // We need to know this so we can toggle the format off.
        else {
            everythingButFormats.forEach((node) => {
                const parent = this.getParentOf(node);
                // If it's text, and the current position is in range of the selection, does the position contain the requested format?
                if (node instanceof TextNode && parent instanceof FormatNode) {
                    // If we're formatting an empty node we previously found, this node's formatting is irrelevant.
                    if (editingEmptyNode) {
                    }
                    // If this node is empty but contains a zero-width selection, remember it, since this is the only node for which formats are relevant.
                    else if (node.getText().length === 0) {
                        if (
                            checkIndex === selectionStartIndex &&
                            zeroWidthSelection
                        ) {
                            editingEmptyNode = true;
                            alreadyApplied = parent
                                .getFormats(this)
                                .includes(format);
                        }
                    }
                    // If this node has more than zero characters, the formatting is all applied if the selection contains the entirety of this node's text
                    // and this node's parent contains the formatting.
                    else {
                        const parentIsFormatted = parent
                            .getFormats(this)
                            .includes(format);
                        const selectionContainsNode =
                            (selectionStartIndex > checkIndex &&
                                selectionStartIndex <
                                    checkIndex +
                                        node.getCaretPositionCount() -
                                        1) ||
                            (selectionEndIndex > checkIndex &&
                                selectionEndIndex <
                                    checkIndex +
                                        node.getCaretPositionCount() -
                                        1);
                        const nodeContainsSelection =
                            selectionStartIndex >= checkIndex &&
                            selectionEndIndex <=
                                checkIndex + node.getCaretPositionCount();
                        checkIndex += node.getCaretPositionCount();
                        if (nodeContainsSelection || selectionContainsNode) {
                            nodeCount++;
                            if (parentIsFormatted) nodesWithFormat++;
                        }
                    }
                }
                // Treat all non-text as containing the requested format.
                else return true;
            });
            if (nodeCount > 0 && nodesWithFormat === nodeCount)
                alreadyApplied = true;
        }

        // Reformat everything. The strategy is to step through each character, atom node, and metadata node in this format node
        // and create a new series of formats that preserve existing formatting while applying new formatting to the selection.
        let newFormats: {
            format: Format;
            segments: FormatNodeSegmentType[];
        }[] = [{ format: '', segments: [] }]; // A stack of formats we're constructing.
        let textIndex = 0;
        let currentText = ''; // The current text we've accumulated, inserted before each format change and at the end.
        let formattingEmptyNode = false;
        let emptyNode = undefined;

        function saveText() {
            // If there's some text, update the current format with the current text, then reset it.
            if (currentText.length > 0) {
                newFormats[0].segments.push(new TextNode(currentText));
                currentText = '';
            }
        }

        function inRange() {
            return (
                selectionStartIndex !== undefined &&
                selectionEndIndex !== undefined &&
                textIndex >= selectionStartIndex &&
                textIndex < selectionEndIndex
            );
        }

        function getFormats() {
            // We don't include non-formatted text in the list of formats applied.
            return newFormats.map((f) => f.format).filter((f) => f !== '');
        }

        function finishFormat() {
            const formatSpec = newFormats[0];
            newFormats.shift();
            // Keep the new format clean by only adding the format node if it's not empty, or if it's a zero width selection.
            if (
                formatSpec.segments.length > 0 ||
                (zeroWidthSelection && textIndex === selectionStartIndex)
            )
                newFormats[0].segments.push(
                    new FormatNode(formatSpec.format, formatSpec.segments)
                );
        }

        everythingButFormats.forEach((node) => {
            const parent = this.getParentOf(node);
            if (node instanceof TextNode) {
                // If this is a text node in an atom node we're not formatting the atom node's format, then just
                // account for it's length, but do nothing else.
                const atomAncestor = node.getClosestParentOfType(
                    this,
                    AtomNode
                );
                if (
                    atomAncestor instanceof AtomNode &&
                    atomAncestor.getMeta() !== this &&
                    atomAncestor.getMeta() instanceof FormatNode
                ) {
                    textIndex += node.getCaretPositionCount();
                } else if (parent instanceof FormatNode) {
                    // Remember we found an empty node so that we don't insert an extra one later.
                    if (node.getText().length === 0) {
                        if (
                            textIndex === selectionStartIndex &&
                            zeroWidthSelection
                        ) {
                            formattingEmptyNode = true;
                            textIndex++;
                        }
                    } else {
                        // Process each character in the node, including the very last position.
                        for (let i = 0; i <= node.getText().length; i++) {
                            // Determine the desired format for this character. Start with the current formats
                            // and if we're in the selected range, adjust them accordingly based on the current formats
                            // and the requested format. (If this is a range deletion, then we just stick with the existing formats).
                            let formatter = node.getFormat(this);
                            let desiredFormats = formatter
                                ? formatter.getFormats(this)
                                : [];
                            if (
                                format !== undefined &&
                                ((textIndex === selectionStartIndex &&
                                    zeroWidthSelection) ||
                                    inRange())
                            ) {
                                // Remove all formatting if we were asked to.
                                if (format === '') desiredFormats = [];
                                // Apply the formatting if it's not already applied.
                                else if (
                                    !alreadyApplied &&
                                    !desiredFormats.includes(format)
                                )
                                    desiredFormats.push(format);
                                // Remove the formatting if it's already applied in the selection.
                                else if (
                                    alreadyApplied &&
                                    desiredFormats.includes(format)
                                )
                                    desiredFormats.splice(
                                        desiredFormats.indexOf(format),
                                        1
                                    );
                            }

                            // Remove undesired formats.
                            getFormats().forEach((activeFormat) => {
                                // If the current format is not in the desired list, close the text
                                // node and keep popping formats until we find the parent of the offending format.
                                if (!desiredFormats.includes(activeFormat)) {
                                    // Save any text that we've accumulated.
                                    saveText();

                                    // Not sure this loop is necessary; we should always remove in the order we added.
                                    while (
                                        newFormats[0].format !== activeFormat
                                    )
                                        finishFormat();
                                    // Do it one more time to close out the undesired format.
                                    finishFormat();

                                    // If we have unformatted something at a zero-width range, create empty format node, add a text node in it and remember it so
                                    // we can place the caret in it.
                                    if (
                                        !formattingEmptyNode &&
                                        textIndex === selectionStartIndex &&
                                        zeroWidthSelection
                                    ) {
                                        // Remember the node for later, so we can place the caret in it.
                                        emptyNode = new TextNode();
                                        // Append the empty node to the current format.
                                        newFormats[0].segments.push(emptyNode);
                                        // Push a new format onto the stack to start adding to.
                                        newFormats.unshift({
                                            format: activeFormat,
                                            segments: [],
                                        });
                                    }
                                }
                            });

                            // Ensure the desired formats.
                            desiredFormats.forEach((desiredFormat) => {
                                // If the current format does not yet include the desired format,
                                // close the text node and start a new format.
                                if (!getFormats().includes(desiredFormat)) {
                                    // Save any text that we've accumulated in the curent format.
                                    saveText();

                                    // Add a new format onto the stack to start adding to.
                                    newFormats.unshift({
                                        format: desiredFormat,
                                        segments: [],
                                    });

                                    // If we inserted an empty format node, add a text node in it and remember it so
                                    // we can place the caret in it.
                                    if (
                                        !formattingEmptyNode &&
                                        textIndex === selectionStartIndex &&
                                        zeroWidthSelection
                                    ) {
                                        emptyNode = new TextNode();
                                        newFormats[0].segments.push(emptyNode);
                                        finishFormat();
                                    }
                                }
                            });

                            // If there's a format we're applying, or we're outside the deletion range, append the current character.
                            // We don't do this if we're checking the very last index of the node, since there is no character after it.
                            if (i < node.getLength()) {
                                if (format !== undefined || !inRange())
                                    currentText += node.getText().charAt(i);
                                // Increment the text index for this character.
                                textIndex++;
                            }
                        }
                    }
                }
                // If the parent is a MetadataNode
                else if (parent instanceof MetadataNode) {
                    // Save whatever text came before it.
                    saveText();

                    // Process each character in the node if we're formatting, and if we're deleting, skip anything in range of deletion.
                    for (let i = 0; i < node.getText().length; i++) {
                        if (format !== undefined || !inRange())
                            currentText += node.getText().charAt(i);
                        textIndex++;
                    }

                    // Duplicate the MetadataNode but with new text. Erase the MetadataNode if the text is empty
                    // by simply not adding one to this new format. Then, erase the text, since it was added in the metadata node.
                    if (currentText.length > 0) {
                        newFormats[0].segments.push(
                            parent.withText(new TextNode(currentText))
                        );
                        currentText = '';
                    }
                }
            }
            // If it's an AtomNode, just add it unmodified, since we only format text.
            // But if it's it's in range of the deletion, skip it, since we're deleting.
            else if (node instanceof AtomNode) {
                // Before adding the atom, create a text node and reset the accumulator.
                saveText();

                // Add the atom immediately after, unless it's in the deletion range.
                // We include the start index since AtomNode's text index is on the left.
                if (
                    format !== undefined ||
                    textIndex < selectionStartIndex ||
                    textIndex > selectionEndIndex
                ) {
                    // Does the atom node have a format? Format it!
                    let newAtom = node;
                    const atomMeta = node.getMeta();
                    if (atomMeta instanceof FormatNode) {
                        if (
                            atomMeta.contains(range.start.node) &&
                            atomMeta.contains(range.end.node)
                        ) {
                            const newFormat = atomMeta.withFormat(
                                range,
                                format
                            );
                            newAtom = node.withMeta(newFormat);
                        }
                    }
                    // Add the formatted atom if there is one.
                    newFormats[0].segments.push(
                        newAtom !== undefined ? newAtom : node
                    );
                }

                // Increment the text index; atoms count for one character.
                textIndex++;
            }
        });

        // Save any remaining text that we've accumulated.
        saveText();

        // Keep finishing formats until we get to the original we created.
        while (newFormats.length > 1) finishFormat();

        // Create the final format.
        let newFormat = new FormatNode(
            newFormats[0].format,
            newFormats[0].segments
        );

        // If after all that, it's empty, make sure there's one empty text node to type in.
        if (newFormat.getTextAndAtomNodes().length === 0)
            newFormat = new FormatNode('', [new TextNode()]);
        // If it starts or ends with an atom, insert an empty node so that text can be inserted before or after.
        else {
            if (newFormat.#segments[0] instanceof AtomNode)
                newFormat = newFormat.withSegmentPrepended(new TextNode());
            if (
                newFormat.#segments[newFormat.getLength() - 1] instanceof
                AtomNode
            )
                newFormat = newFormat.withSegmentAppended(new TextNode());
        }

        return newFormat;
    }

    withRangeFormatted(range: CaretRange, format: Format | undefined): Edit {
        // Convert the range to text indices.
        const text = caretRangeToIndexRange(this, range);
        if (text === undefined) return;
        const newFormat = this.withFormat(range, format);
        if (newFormat === undefined) return;
        const newStart = indexToCaret(newFormat, text.start);
        const newEnd =
            format === undefined ? newStart : indexToCaret(newFormat, text.end);
        if (newStart === undefined || newEnd === undefined) return;
        return { root: newFormat, range: { start: newStart, end: newEnd } };
    }

    getFormats(root: Node): Format[] {
        let format: Node | undefined = this;
        const formats: Format[] = [];
        while (format instanceof FormatNode) {
            if (format.#format !== '') formats.push(format.#format);
            format = format.getParent(root);
        }
        return formats;
    }

    withSegmentAt(
        segment: FormatNodeSegmentType,
        caret: Caret
    ): FormatNode | undefined {
        if (!(caret.node instanceof TextNode)) return;

        // Verify that the caret's node is a segment in this node.
        const index = this.#segments.indexOf(caret.node);
        if (index < 0) return;

        // Splice the text node.
        const left = new TextNode(
            caret.node.getText().substring(0, caret.index)
        );
        const right = new TextNode(caret.node.getText().substring(caret.index));

        // Insert the new left, right and middle
        const newSegments = this.#segments.slice();
        newSegments.splice(index, 1, left, segment, right);
        return new FormatNode(this.#format, newSegments);
    }

    withSegmentAtSelection(
        range: CaretRange,
        nodeCreator: (text: string) => FormatNodeSegmentType
    ): Edit {
        // If there's a selection, grab it's text and then remove the text and update the root and text being edited.
        let selectedText = this.getSelectedText(range);
        let newFormat: FormatNode | undefined = this;
        const sortedRange = this.sortRange(range);
        let caret = sortedRange.start;
        if (
            sortedRange.start.node !== sortedRange.end.node ||
            sortedRange.start.index !== sortedRange.end.index
        ) {
            // Try to remove the selected text. Bail on fail.
            const textIndex = caretToIndex(this, sortedRange.start);
            if (textIndex === undefined) return;
            newFormat = this.withoutRange(sortedRange);
            if (newFormat === undefined) return;
            const newCaret = indexToCaret(newFormat, textIndex);
            if (newCaret === undefined) return;
            caret = newCaret;
        }

        // Create and insert the into the formatted node.
        const newNode = nodeCreator.call(
            undefined,
            selectedText ? selectedText : ''
        );
        const revisedFormat = newFormat.withSegmentAt(newNode, caret);
        if (revisedFormat === undefined) return;
        const newCaret =
            newNode instanceof AtomNode
                ? newNode.getDefaultCaret()
                : newNode instanceof FormatNode
                ? newNode.getFirstCaret()
                : newNode instanceof MetadataNode
                ? { node: newNode.getText(), index: 0 }
                : newNode instanceof TextNode
                ? { node: newNode, index: 0 }
                : undefined;

        if (newCaret === undefined) return;
        return {
            root: revisedFormat,
            range: { start: newCaret, end: newCaret },
        };
    }

    withoutContentBefore(caret: Caret): FormatNode | undefined {
        return this.withContentAt(caret, false);
    }

    withoutContentAfter(caret: Caret): FormatNode | undefined {
        return this.withContentAt(caret, true);
    }

    withContentAt(caret: Caret, before: boolean): FormatNode | undefined {
        let range = undefined;
        if (before) {
            const lastCaret = this.getLastCaret();
            if (lastCaret === undefined) return;
            range = { start: caret, end: lastCaret };
        } else {
            const firstCaret = this.getFirstCaret();
            if (firstCaret === undefined) return;
            range = { start: firstCaret, end: caret };
        }
        return this.withoutRange(range);
    }

    withContentInRange(range: CaretRange): this | undefined {
        const containsStart = this.contains(range.start.node);
        const containsEnd = this.contains(range.end.node);
        if (!containsStart && !containsEnd) return this.copy();
        const startCaret = containsStart ? range.start : this.getFirstCaret();
        const endCaret = containsEnd ? range.end : this.getLastCaret();
        if (startCaret === undefined || endCaret === undefined) return;
        const startIndex = caretToIndex(this, startCaret);
        const endIndex = caretToIndex(this, endCaret);
        if (startIndex === undefined || endIndex === undefined) return;
        const withoutBefore = this.withoutContentBefore(startCaret);
        if (withoutBefore === undefined) return;
        const revisedEndCaret = indexToCaret(
            withoutBefore,
            endIndex - startIndex
        );
        if (revisedEndCaret === undefined) return;
        return withoutBefore.withoutContentAfter(revisedEndCaret) as this;
    }

    withSegmentsAppended(format: FormatNode): FormatNode {
        return new FormatNode(this.#format, [
            ...this.#segments,
            ...format.getSegments(),
        ]);
    }

    withoutAdjacentContent(caret: Caret, next: boolean): Edit | undefined {
        return this.withoutCharacter(caret, next);
    }

    withoutCharacter(caret: Caret, next: boolean): Edit | undefined {
        // Confirm that this caret is in this format.
        if (!this.contains(caret.node)) return;
        // Is there an adjascent caret? Return nothing if not.
        const adjacentCaret = this.getAdjacentCaret(caret, next);
        if (adjacentCaret === undefined) return;

        // Handle each case differently
        if (caret.node instanceof AtomNode) {
            const newFormat = this.withNodeReplaced(caret.node, undefined);
            if (newFormat === undefined) return;
            return {
                root: newFormat,
                range: { start: adjacentCaret, end: adjacentCaret },
            };
        } else if (adjacentCaret.node instanceof AtomNode) {
            const newFormat = this.withNodeReplaced(
                adjacentCaret.node,
                undefined
            );
            if (newFormat === undefined) return;
            return { root: newFormat, range: { start: caret, end: caret } };
        } else {
            // If next, keep the caret in place, otherwise go to the adjacent caret position.
            const textIndex = caretToIndex(this, next ? caret : adjacentCaret);
            if (textIndex === undefined) return;
            // If there is one, try removing everything between this and the adjascent caret.
            const newFormat = this.withoutRange({
                start: caret,
                end: adjacentCaret,
            });
            if (newFormat === undefined) return;
            const newCaret = indexToCaret(newFormat, textIndex);
            if (newCaret === undefined) return;
            return {
                root: newFormat,
                range: { start: newCaret, end: newCaret },
            };
        }
    }

    withNodeInserted(caret: Caret, node: Node): Edit {
        // The caret node has to be one of the nodes in this format to insert.
        const index = this.#segments.indexOf(
            caret.node as FormatNodeSegmentType
        );
        if (index < 0) return;
        // The inserted node has to be a segment type.
        if (
            !(
                node instanceof FormatNode ||
                node instanceof TextNode ||
                node instanceof MetadataNode ||
                node instanceof AtomNode
            )
        )
            return;

        const newFormat = this.withSegmentAt(node, caret);
        const newCaret =
            node instanceof AtomNode
                ? node.getDefaultCaret()
                : node instanceof FormatNode
                ? node.getLastCaret()
                : node instanceof MetadataNode
                ? { node: node.getText(), index: node.getText().getLength() }
                : { node: node, index: node.getLength() };
        if (newFormat === undefined || newCaret === undefined) return;
        return { root: newFormat, range: { start: newCaret, end: newCaret } };
    }
}
