import { Node } from "./Node";
import { Caret, CaretRange, TextRange } from "./Caret";
import { Edit } from "./Edit";
import { Format, FormatNode, FormatNodeSegmentType } from "./FormatNode";
import { TextNode } from "./TextNode";
import { AtomNode } from "./AtomNode";

export abstract class BlockNode extends Node {

    abstract getFormats(): FormatNode[];

    isEmpty() { return this.getFormats().every(f => f.isEmptyText()); }
    getTextNodes(): TextNode[] { return this.getNodes().filter(n => n instanceof TextNode) as TextNode[]; }
    getFirstCaret() { return this.getFormats()[0].getFirstCaret(); }

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

    caretToTextIndex(caret: Caret): number | undefined {
        // Loop through all the formats in order and compute a text index.
        const formats = this.getFormats();
        let index = 0;
        for(let i = 0; i < formats.length; i++) {
            const format = formats[i];
            const formatIndex = format.caretToTextIndex(caret);
            if(formatIndex === undefined)
                index += format.getTextLength();
            else {
                return index + formatIndex;
            }
        }
        return undefined;
    }

    textIndexToCaret(index: number): Caret | undefined {
        // Loop through all the formats and find format that contains the index and ask it for a caret.
        const formats = this.getFormats();
        let currentIndex = 0;
        for(let i = 0; i < formats.length; i++) {
            const format = formats[i];
            const length = format.getTextLength();
            if(index >= currentIndex && index <= currentIndex + length)
                return format.textIndexToCaret(index - currentIndex);
            currentIndex += length;
        }
    }

    caretRangeToTextRange(range: CaretRange): TextRange | undefined {
        const startIndex = this.caretToTextIndex(range.start);
        const endIndex = this.caretToTextIndex(range.end);
        if(startIndex === undefined || endIndex === undefined) return;
        return { start: startIndex, end: endIndex };
    }

    textRangeToCaret(range: TextRange): CaretRange | undefined {
        const start = this.textIndexToCaret(range.start);
        const end = this.textIndexToCaret(range.end);
        if(start === undefined || end === undefined) return;
        return { start: start, end: end }; 
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
        const formats = this.getFormats();
        let newRoot: this | undefined = this;
        let newStart: Caret | undefined;
        let newEnd: Caret | undefined;
        let inRange = false;
        // Find all of the formats contained in the range and format then.
        for(let i = 0; i < formats.length; i++) {
            const f = formats[i];
            const containsStart = f.contains(range.start.node);
            const containsEnd = f.contains(range.end.node);
            if(containsStart)
                inRange = true;
            if(inRange) {
                // Revise the entire format.
                const first = containsStart ? range.start : f.getFirstCaret();
                const last = containsEnd ? range.end : f.getLastCaret();
                if(first && last) {
                    const edit = f.withRangeFormatted({ start: first, end: last }, format);
                    if(edit === undefined) return;
                    newRoot = newRoot.withChildReplaced(f, edit.root);
                    if(newRoot === undefined) return;
                    if(containsStart)
                        newStart = edit.range.start;
                    if(containsEnd)
                        newEnd = edit.range.end;
                }
            }
            if(containsEnd)
                inRange = false;
        }

        if(newRoot && newStart && newEnd)
            return { root: newRoot, range: { start: newStart, end: newEnd } };
    }

}