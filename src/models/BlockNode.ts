import { Node } from "./Node";
import { Caret, CaretRange, IndexRange, indexToCaret, caretToIndex } from "./Caret";
import { Edit } from "./Edit";
import { Format, FormatNode, FormatNodeSegmentType } from "./FormatNode";
import { TextNode } from "./TextNode";
import { AtomNode } from "./AtomNode";

export abstract class BlockNode extends Node {

    abstract getFormats(): FormatNode[];

    isEmpty() { return this.getFormats().every(f => f.isEmptyText()); }
    getTextNodes(): TextNode[] { return this.getNodes().filter(n => n instanceof TextNode) as TextNode[]; }
    getFirstCaret() { return this.getFormats()[0].getFirstCaret(); }
    getLastCaret() { 
        const formats = this.getFormats();
        return formats.length === 0 ? undefined : formats[formats.length - 1].getLastCaret(); 
    }

    getAdjacentCaret(caret: Caret, next: boolean): Caret | undefined {
        const formats = next ? this.getFormats() : this.getFormats().reverse();
        // Iterate throught the formats and find the one that contains the caret.
        for(let i = 0; i < formats.length; i++) {
            const format = formats[i];
            if(format.contains(caret.node)) {
                const adjacentCaret = format.getAdjacentCaret(caret, next);
                if(adjacentCaret === undefined)
                    return i < formats.length - 1 ? (next ? formats[i + 1].getFirstCaret() : formats[i + 1].getLastCaret()) : undefined;
                else
                    return adjacentCaret;
            }
        }
    }

    getNextTextOrAtom(node: TextNode | AtomNode<any>): TextNode | AtomNode<any> | undefined {
        return this.getAdjacentCaret({ node: node, index: node instanceof AtomNode ? 0 : node.getLength() }, true)?.node;
    }
    getPreviousTextOrAtom(node: TextNode | AtomNode<any>): TextNode | AtomNode<any> | undefined {
        return this.getAdjacentCaret({ node: node, index: 0 }, true)?.node;
    }

    withSegmentAtSelection(range: CaretRange, nodeCreator: (text: string) => FormatNodeSegmentType): Edit {

        let block: BlockNode = this;
        let caret = range.start;

        // Only works at a text node.
        if(!(caret.node instanceof TextNode)) return;

        // Get the nearest FormatNode parent of the selected text. Bail on fail.
        const formatted = caret.node.getClosestParentOfType<FormatNode>(block, FormatNode);
        if(formatted === undefined) return;
        
        // Update the format and replace it in the blocks.
        const edit = formatted.withSegmentAtSelection(range, nodeCreator);
        if(edit === undefined || !(edit.root instanceof FormatNode)) return;
        const newBlock = block.withNodeReplaced(formatted, edit.root);
        if(newBlock === undefined) return;
        return { root: newBlock, range: edit.range };

    }

    withoutAdjacentContent(caret: Caret, next: boolean): Edit | undefined {

        const formats = next ? this.getFormats() : this.getFormats().reverse();
        let editedFormat = undefined;
        let newFormatEdit = undefined;
        while(formats.length > 0) {
            const format = formats.shift();
            if(format) {
                const edit = format.withoutAdjacentContent(caret, next);
                if(edit) {
                    editedFormat = format;
                    newFormatEdit = edit;
                    break;
                }
            }
        }
        if(newFormatEdit && editedFormat) {
            const newRoot = this.withChildReplaced(editedFormat, newFormatEdit.root)
            if(newRoot)
                return { root: newRoot, range: newFormatEdit.range };
        }

    }

    withRangeFormatted(range: CaretRange, format: Format | undefined): Edit {
        const sortedRange = this.sortRange(range);
        const formats = this.getFormats();
        let newRoot: this | undefined = this;
        let newStart: Caret | undefined;
        let newEnd: Caret | undefined;
        let inRange = false;

        // Find all of the formats contained in the range and format then.
        for(let i = 0; i < formats.length; i++) {
            const f = formats[i];
            const containsStart = f.contains(sortedRange.start.node);
            const containsEnd = f.contains(sortedRange.end.node);
            if(containsStart || containsEnd)
                inRange = true;
            if(inRange) {
                // Revise the entire format.
                const first = containsStart ? sortedRange.start : f.getFirstCaret();
                const last = containsEnd ? sortedRange.end : f.getLastCaret();
                if(first && last) {
                    const edit = f.withRangeFormatted({ start: first, end: last }, format);
                    if(edit === undefined) return;
                    const newFormat = edit.root as FormatNode;
                    const deleteChild = newFormat.isEmptyText();
                    // Delete the format if it's empty.
                    newRoot = newRoot.withNodeReplaced(f, deleteChild ? undefined : newFormat);
                    if(newRoot === undefined) return;
                    if(containsStart && !deleteChild)
                        newStart = edit.range.start;
                    if(containsEnd && !deleteChild)
                        newEnd = edit.range.end;
                }
            }
            if(containsEnd)
                inRange = false;
        }

        if(newRoot) {
            if(newStart === undefined) newStart = newRoot.getFirstCaret();
            if(newEnd === undefined) newEnd = newRoot.getLastCaret();
            if(newStart && newEnd)
                return { root: newRoot, range: { start: newStart, end: newEnd } };
        }
    }

}