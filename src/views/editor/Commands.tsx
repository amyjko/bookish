import { BlocksNode } from "../../models/BlocksNode";
import { CalloutNode } from "../../models/CalloutNode";
import { CaretRange } from "../../models/Caret";
import { ChapterNode } from "../../models/ChapterNode";
import { CitationsNode } from "../../models/CitationsNode";
import { CodeNode } from "../../models/CodeNode";
import { CommentNode } from "../../models/CommentNode";
import { DefinitionNode } from "../../models/DefinitionNode";
import { EmbedNode } from "../../models/EmbedNode";
import { FootnoteNode } from "../../models/FootnoteNode";
import { FormatNode } from "../../models/FormatNode";
import { InlineCodeNode } from "../../models/InlineCodeNode";
import { LabelNode } from "../../models/LabelNode";
import { LinkNode } from "../../models/LinkNode";
import { ListNode } from "../../models/ListNode";
import { ParagraphNode } from "../../models/ParagraphNode";
import { QuoteNode } from "../../models/QuoteNode";
import { RuleNode } from "../../models/RuleNode";
import { TableNode } from "../../models/TableNode";
import { TextNode } from "../../models/TextNode";
import { Node } from "../../models/Node";
import { CaretState, CaretUtilities } from "./ChapterEditor";

// From: https://thenounproject.com/browse/collection-icon/minio-text-editor-bold-13520/?p=1
import Clear from "../svg/clear.svg";
import Bold from "../svg/bold.svg";
import Italic from "../svg/italic.svg";
import Link from "../svg/link.svg";
import Media from "../svg/media.svg";
import Subscript from "../svg/sub.svg";
import Superscript from "../svg/super.svg";
import Comment from "../svg/comment.svg";
import Indent from "../svg/indent.svg";
import Unindent from "../svg/unindent.svg";
import Paragraph from "../svg/paragraph.svg";
import Bullets from "../svg/bullets.svg";
import Numbers from "../svg/numbers.svg";
import Quote from "../svg/quote.svg";
import Code from "../svg/code.svg";
import Undo from "../svg/undo.svg";
import Redo from "../svg/redo.svg";
import { AtomNode } from "../../models/AtomNode";
import { BlockNode } from "../../models/BlockNode";
import { Edit } from "../../models/Edit";

export type Command = {
    label?: string,
    icon?: Function,
    description: string
    category: string,
    control: boolean,
    alt: boolean,
    shift: boolean | undefined,
    key?: string | string[],
    code?: string,
    visible: (context: CaretState) => boolean,
    active: (context: CaretState, key?: string) => boolean,
    handler: (
        context: CaretState,
        utilities: CaretUtilities,
        key: string) => Edit
}

function insertTableRowColumn(root: ChapterNode, table: TableNode, format: FormatNode, row: boolean, before: boolean): Edit {
    const location = table.locate(format);
    if(location) {
        // Make the new table.
        const newTable = row ? table.withNewRow(location.row + (before ? 0 : 1)): table.withNewColumn(location.column + (before ? 0 : 1));
        if(newTable === undefined) return;

        const newRoot = table.replace(root, newTable);
        if(newRoot === undefined) return;

        const newFormat = table.getCell(location.row + (row && !before ? 1 : 0), location.column + (!row && !before ? 1 : 0));
        if(newFormat) {
            const newCaret = { node: newFormat.getTextNodes()[0], index: 0 };
            return { root: newRoot, range: { start: newCaret, end: newCaret } };
        }
    }
    return undefined;
}

function deleteTableRowColumn(root: ChapterNode, table: TableNode, format: FormatNode, row: boolean): Edit {
    const location = table.locate(format);
    if(!location) return undefined;

    const newTable = row ? table.withoutRow(location.row) : table.withoutColumn(location.column);
    if(newTable === undefined) return;

    const newRoot = table.replace(root, newTable);
    if(newRoot === undefined || !(newRoot instanceof ChapterNode)) return;

    const newFormat = row ?
        table.getCell(location.row === table.getRowCount() ? location.row - 1 : location.row, location.column) :
        table.getCell(location.row, location.column === table.getColumnCount() ? location.column - 1 : location.column)
    if(!newFormat) return undefined;
    const newCaret = { node: newFormat.getTextNodes()[0], index: 0 };
    return { root: newRoot, range: { start: newCaret, end: newCaret } };

}

function insertBlock(context: CaretState, block: BlockNode): Node | undefined {

    if(context.blocks && context.paragraph) {
        const newBlocks = context.blocks.withBlockInsertedBefore(context.paragraph, block);
        if(newBlocks === undefined) return;
        const newRoot = context.blocks.replace(context.chapter, newBlocks);
        return newRoot;
    }

}

function unwrapMeta(context: CaretState): Edit {

    if(context.format === undefined || context.meta === undefined) return;
    const newFormat = context.format.withSegmentReplaced(context.meta, context.meta.getText());
    if(newFormat === undefined) return;
    const newRoot = context.format.replace(context.format, newFormat);
    if(newRoot === undefined) return;
    return { root: newRoot, range: context.range };

}

// An ordered list of command specifications for keyboard and mouse input.
export const commands: Command[] = [
    {
        label: "row ↑",
        description: "insert row above",
        category: "table",
        control: false, alt: true, shift: false, key: "ArrowUp",
        visible: context => context.table !== undefined,
        active: context => context.table !== undefined && context.format !== undefined,
        handler: context => {
            if(!context.table || !context.format) return;
            return insertTableRowColumn(context.chapter, context.table, context.format, true, true);
        }
    },
    {
        label: "row ↓",
        description: "insert row below",
        category: "table",
        control: false, alt: true, shift: false, key: "ArrowDown",
        visible: context => context.table !== undefined,
        active: context => context.table !== undefined && context.format !== undefined,
        handler: context => {
            if(!context.table || !context.format) return;
            return insertTableRowColumn(context.chapter, context.table, context.format, true, false);
        }
    },
    {
        label: "col →",
        description: "insert column after",
        category: "table",
        control: false, alt: true, shift: false, key: "ArrowRight",
        visible: context => context.table !== undefined,
        active: context => context.table !== undefined && context.format !== undefined,
        handler: context => {
            if(!context.table || !context.format) return;
            return insertTableRowColumn(context.chapter, context.table, context.format, false, false);
        }
    },
    {
        label: "col ←",
        description: "insert column before",
        category: "table",
        control: false, alt: true, shift: false, key: "ArrowLeft",
        visible: context => context.table !== undefined,
        active: context => context.table !== undefined && context.format !== undefined,
        handler: context => {
            if(!context.table || !context.format) return;
            return insertTableRowColumn(context.chapter, context.table, context.format, false, true);
        }
    },
    {
        label: "\u232B row",
        description: "delete row",
        category: "table",
        control: false, alt: true, shift: false, key: "Backspace",
        visible: context => context.table !== undefined,
        active: context => context.format !== undefined && context.table !== undefined && context.table.getRowCount() > 1,
        handler: context => {
            if(!context.table || !context.format) return;
            return deleteTableRowColumn(context.chapter, context.table, context.format, true);
        }
    },
    {
        label: "\u232B col",
        description: "delete column",
        category: "table",
        control: false, alt: true, shift: true, key: "Backspace",
        visible: context => context.table !== undefined,
        active: context => context.format !== undefined && context.table !== undefined && context.table.getColumnCount() > 1,
        handler: context => {
            if(!context.table || !context.format) return;
            return deleteTableRowColumn(context.chapter, context.table, context.format, false);
        }
    },
    {
        description: "move to previous character",
        category: "navigation",
        control: false, alt: false, shift: false, key: "ArrowLeft",
        visible: context => false,
        active: context => context.endIsTextOrAtom,
        handler: context => {
            if(context.end.node instanceof TextNode) {
                const newCaret = context.end.node.previous(context.chapter, context.end.index)
                return { root: context.chapter, range: {start: newCaret, end: newCaret } }
            }
        }
    },
    {
        description: "move to previous word",
        category: "navigation",
        control: false, alt: true, shift: false, key: "ArrowLeft",
        visible: context => false,
        active: context => context.endIsTextOrAtom,
        handler: context => {
            if(context.end.node instanceof TextNode) {
                const previous = context.end.node.previousWord(context.chapter, context.end.index);
                return { root: context.chapter, range: { start: previous, end: previous } };
            }
        }
    },
    {
        description: "move to paragraph start",
        category: "navigation",
        control: true, alt: false, shift: false, key: "ArrowLeft",
        visible: context => false,
        active: context => context.format !== undefined,
        handler: context => {
            const first = (context.format as FormatNode).getFirstTextNode();
            return { root: context.chapter, range: { start: { node: first, index: 0 }, end: { node: first, index: 0 }}}
        }
    },
    {
        description: "expand selection to previous character",
        category: "selection",
        control: false, alt: false, shift: true, key: "ArrowLeft",
        visible: context => false,
        active: context => context.endIsTextOrAtom,
        handler: context => {
            const previous = (context.end.node as TextNode).previous(context.chapter, context.end.index);
            return { root: context.chapter, range: { start: context.start, end: previous } };
        }
    },
    {
        description: "expand selection to previous word",
        category: "selection",
        control: false, alt: true, shift: true, key: "ArrowLeft",
        visible: context => false,
        active: context => context.endIsTextOrAtom,
        handler: context => {
            const previous = (context.end.node as TextNode).previousWord(context.chapter, context.end.index);
            return { root: context.chapter, range: { start: context.start, end: previous } };
        }
    },
    {
        description: "expand selection to start",
        category: "selection",
        control: true, alt: false, shift: true, key: "ArrowLeft",
        visible: context => false,
        active: context => context.format !== undefined,
        handler: context => {
            const first = (context.format as FormatNode).getFirstTextNode();
            return { root: context.chapter, range: { start: context.start, end: { node: first, index: 0 } } };
        }
    },
    {
        description: "move to next character",
        category: "navigation",
        control: false, alt: false, shift: false, key: "ArrowRight",
        visible: context => false,
        active: context => context.endIsTextOrAtom,
        handler: context => {
            const next = (context.end.node as TextNode).next(context.chapter, context.end.index);
            return { root: context.chapter, range: { start: next, end: next } };
        }
    },
    {
        description: "move to next word",
        category: "navigation",
        control: false, alt: true, shift: false, key: "ArrowRight",
        visible: context => false,
        active: context => context.endIsTextOrAtom,
        handler: context => {
            const next = (context.end.node as TextNode).nextWord(context.chapter, context.end.index);
            return { root: context.chapter, range: { start: next, end: next } }
        }
    },
    {
        description: "move to paragraph end",
        category: "navigation",
        control: true, alt: false, shift: false, key: "ArrowRight",
        visible: context => false,
        active: context => context.format !== undefined,
        handler: context => {
            const last = (context.format as FormatNode).getLastTextNode();
            const caret = { node: last, index: last.getLength() };
            return { root: context.chapter, range: { start: caret, end: caret} };
        }
    },
    {
        description: "expand selection to next character",
        category: "selection",
        control: false, alt: false, shift: true, key: "ArrowRight",
        visible: context => false,
        active: context => context.endIsTextOrAtom,
        handler: context => {
            const previous = (context.end.node as TextNode).next(context.chapter, context.end.index);
            return { root: context.chapter, range: { start: context.start, end: previous } };
        }
    },
    {
        description: "expand selection to next word",
        category: "selection",
        control: false, alt: true, shift: true, key: "ArrowRight",
        visible: context => false,
        active: context => context.endIsTextOrAtom,
        handler: context => {
            const previous = (context.end.node as TextNode).nextWord(context.chapter, context.end.index);
            return { root: context.chapter, range: { start: context.start, end: previous } };
        }
    },
    {
        description: "expand selection to end",
        category: "selection",
        control: true, alt: false, shift: true, key: "ArrowRight",
        visible: context => false,
        active: context => context.format !== undefined,
        handler: context => {
            const last = (context.format as FormatNode).getLastTextNode();
            return { root: context.chapter, range: { start: context.start, end: { node: last, index: last.getLength() } } };
        }
    },
    {
        description: "expand selection to all",
        category: "selection",
        control: true, alt: false, shift: false, key: "a",
        visible: context => false,
        active: context => true,
        handler: context => {
            // If in a footnote, expand to the footnote.
            if(context.atom) {
                const format = context.atom.getMeta();
                return { root: context.chapter, range: { start: format.getFirstCaret(), end: format.getLastCaret() } };
            }
            else {
                // Find the first and last caret of the entire chapter.
                const text = context.chapter?.getTextNodes();
                if(text && text.length > 0) {
                    return { 
                        root: context.chapter, 
                        range: {
                            start: { node: text[0], index: 0 },
                            end: { node: text[text.length - 1], index: text[text.length - 1].getLength() }
                        }
                    };
                }
                return;
            }
        }
    },
    {
        description: "move up one line",
        category: "navigation",
        control: false, alt: false, shift: false, key: "ArrowUp",
        visible: context => false,
        active: context => context.startIsTextOrAtom,
        handler: (context, utilities) => {
            const above = utilities.getCaretOnLine(context.start, false);
            return { root: context.chapter, range: { start: above, end: above } };
        }
    },
    {
        description: "move selection up one line",
        category: "selection",
        control: false, alt: false, shift: true, key: "ArrowUp",
        visible: context => false,
        active: context => context.startIsTextOrAtom,
        handler: (context, utilities) => {
            const above = utilities.getCaretOnLine(context.end, false);
            return { root: context.chapter, range: { start: context.start, end: above } };
        }
    },
    {
        description: "move up down line",
        category: "navigation",
        control: false, alt: false, shift: false, key: "ArrowDown",
        visible: context => false,
        active: context => context.startIsTextOrAtom,
        handler: (context, utilities) => {
            const below = utilities.getCaretOnLine(context.start, true);
            return { root: context.chapter, range: { start: below, end: below } };
        }
    },
    {
        description: "move selection down one line",
        category: "selection",
        control: false, alt: false, shift: true, key: "ArrowDown",
        visible: context => false,
        active: context => context.startIsTextOrAtom,
        handler: (context, utilities) => {
            const below = utilities.getCaretOnLine(context.end, true);
            return { root: context.chapter, range: { start: context.start, end: below } };
        }
    },
    {
        description: "delete list item",
        category: "list",
        control: false, alt: false, shift: false, key: "Backspace",
        visible: context => false,
        active: context => context.list?.atBeginningOfItem(context.chapter, context.start) === true,
        handler: context => {
            if(context.list) {
                const index = context.list.getItemContaining(context.start);
                if(index === undefined) return;
                const edit = context.list.withItemMergedBackwards(index);
                if(edit === undefined) return;
                const [ newList, newCaret ] = edit;
                const newRoot = context.list.replace(context.chapter, newList);
                if(newRoot === undefined) return;
                return { root: newRoot, range: { start: newCaret, end: newCaret }};
            }
        }
    },
    {
        description: "delete previous character",
        category: "text",
        control: false, alt: false, shift: false, key: "Backspace",
        visible: context => false,
        active: context => context.chapter !== undefined,
        handler: context => {

            if(context.start.node instanceof TextNode && context.start.node === context.end.node && context.start.index === context.end.index) {
                // If we're right at the beginning of a paragraph, ask it's block node to backspace over the previous block.
                const firstCaret = context.start.node.getFormatRoot(context.chapter)?.getFirstCaret();
                if(firstCaret && firstCaret.node === context.start.node && firstCaret.index === context.start.index) {
                    const blocks = context.start.node.getBlocks(context.chapter);
                    const currentParagraph = context.start.node.getParagraph(context.chapter);
                    if(currentParagraph && blocks) {
                        if(currentParagraph instanceof ParagraphNode) {
                            const previousBlock = blocks.getBlockBefore(currentParagraph);
                            // If the block before this paragraph is a paragraph, merge the paragraphs.
                            if(previousBlock instanceof ParagraphNode) {
                                const lastIndex = previousBlock.getContent().caretToTextIndex(previousBlock.getLastCaret());
                                const newRoot = previousBlock.replace(context.chapter, previousBlock.withParagraphAppended(currentParagraph));
                                const lastCaret = previousBlock.getContent().textIndexToCaret(lastIndex);
                                if(newRoot && lastCaret)
                                    return { root: newRoot, range: { start: lastCaret, end: lastCaret } }; 
                            }
                            // If the block before is a list node, merge the current paragraph to the last list item.
                            else if(previousBlock instanceof ListNode) {
                                const lastFormat = previousBlock.getLastItem();
                                if(lastFormat) {
                                    const newCaret = lastFormat.getLastCaret();
                                    const newFormat = lastFormat.withSegmentAppended(currentParagraph.getContent());
                                    const newRootWithFormat = newFormat.replace(context.chapter, lastFormat);
                                    if(newRootWithFormat === undefined) return;
                                    const newRootWithoutParagraph = blocks.replace(newRootWithFormat, blocks.withoutBlock(currentParagraph));
                                    if(newRootWithoutParagraph === undefined) return;
                                    return { root: newRootWithoutParagraph, range: { start: newCaret, end: newCaret } };
                                }
                            }
                            // Otherwise, return a root without the previous block, deleting it.
                            else if(previousBlock) {
                                const newBlocks = blocks.replace(context.chapter, blocks.withoutBlock(previousBlock));
                                if(newBlocks === undefined) return;
                                return { root: newBlocks, range: context.range }
                            }
                        }
                    }
                    // Do nothing if there's no blocks node.
                    return;
                }
                // Otherwise, if the current caret isn't a selection, expand the range to select the previous caret position to delete it.
                if(context.end.node instanceof TextNode || context.end.node instanceof AtomNode)
                    context.end = context.end.node.previous(context.chapter, context.end.index);

            }
            // Delete the range.
            else if(context.chapter instanceof ChapterNode)
                context.chapter.withoutRange({ start: context.start, end: context.end });
        }
    },
    {
        description: "delete next character",
        category: "text",
        control: false, alt: false, shift: false, key: "Delete",
        visible: context => false,
        active: context => context.chapter !== undefined,
        handler: context => {
            if(context.start.node instanceof TextNode && context.start.node === context.end.node && context.start.index === context.end.index) {
                // If we're right at the end of a paragraph, ask it's block node to backspace over the previous block.
                const lastCaret = context.start.node.getFormatRoot(context.chapter)?.getLastCaret();
                if(lastCaret && lastCaret.node === context.start.node && lastCaret.index === context.start.index) {
                    const blocks = context.start.node.getBlocks(context.chapter);
                    const currentParagraph = context.start.node.getParagraph(context.chapter);
                    if(currentParagraph && blocks) {
                        if(currentParagraph instanceof ParagraphNode) {
                            const nextBlock = blocks.getBlockAfter(currentParagraph);
                            // If the block after this paragraph is a paragraph, merge the paragraphs.
                            if(nextBlock instanceof ParagraphNode) {
                                const firstIndex = currentParagraph.getContent().caretToTextIndex(currentParagraph.getLastCaret());
                                const newRoot = currentParagraph.replace(context.chapter, currentParagraph.withParagraphAppended(nextBlock));
                                const firstCaret = currentParagraph.getContent().textIndexToCaret(firstIndex);
                                if(newRoot && firstCaret)
                                    return { root: newRoot, range: { start: firstCaret, end: firstCaret } }; 
                            }
                            // If the block before is a list node, merge the current paragraph to the last list item.
                            else if(nextBlock instanceof ListNode) {
                                const firstFormat = nextBlock.getFirstItem();
                                if(firstFormat) {
                                    const newCaret = currentParagraph.getLastCaret();
                                    const newParagraph = new ParagraphNode(currentParagraph.getLevel(), currentParagraph.getContent().withSegmentAppended(firstFormat));
                                    const newRootWithMerge = currentParagraph.replace(context.chapter, newParagraph);
                                    const firstFormatParent = newRootWithMerge?.getParentOf(firstFormat);
                                    if(firstFormatParent === undefined || !(firstFormatParent instanceof ListNode)) return;
                                    const index = firstFormatParent.getIndexOf(firstFormat);
                                    if(index === undefined) return;
                                    const listWithoutFormat = firstFormatParent.withoutItem(index);
                                    if(listWithoutFormat === undefined) return;
                                    const newRoot = firstFormatParent.replace(context.chapter, listWithoutFormat);
                                    if(newRoot === undefined) return;
                                    return { root: newRoot, range: { start: newCaret, end: newCaret } };
                                }
                            }
                            else if(nextBlock) {
                                const newBlocks = blocks.replace(context.chapter, blocks.withoutBlock(nextBlock));
                                if(newBlocks === undefined) return;
                                return { root: newBlocks, range: context.range }
                            }
                        }
                    }
                    // Do nothing if there's no blocks node.
                    return;
                }
                // Otherwise, if the current caret isn't a selection, expand the range to select the previous caret position to delete it.
                if(context.end.node instanceof TextNode || context.end.node instanceof AtomNode)
                    context.end = context.end.node.next(context.chapter, context.end.index);
            }
            // Delete the range
            else if(context.chapter instanceof ChapterNode)
                return context.chapter.withoutRange({ start: context.start, end: context.end });
        }
    },
    {
        description: "insert code newline",
        category: "text",
        control: false, alt: false, shift: false, key: "Enter",
        visible: context => false,
        active: context => context.start.node.isInside(context.chapter, CodeNode),
        handler: context => {
            if(!(context.start.node instanceof TextNode)) return;

            const newText = context.start.node.withCharacterAt("\n", context.start.index);
            if(newText === undefined) return;
            const newRoot = context.start.node.replace(context.chapter, newText);
            if(newRoot === undefined) return;
            const newCaret = { node: newText, index: context.start.index + 1 };
            return { root: newRoot, range: { start: newCaret, end: newCaret } };
    
        }
    },
    {
        description: "split list item",
        category: "list",
        control: false, alt: false, shift: false, key: "Enter",
        visible: context => false,
        active: context => context.start.node.closestParent<ListNode>(context.chapter, ListNode) !== undefined,
        handler: context => {
            const list = context.start.node.closestParent<ListNode>(context.chapter, ListNode);
            const format = context.start.node.closestParent<FormatNode>(context.chapter, FormatNode);
            if(format === undefined) return;
            const parts = format.split(context.start);
            if(list === undefined || parts === undefined)
                return;
            const [ first, second ] = parts;
            const formatIndex = list.getIndexOf(format);
            if(formatIndex === undefined) return;
            const newList = list.withItemAfter(second, format)?.withItemAfter(first, format)?.withoutItem(formatIndex);
            if(newList === undefined) return;
            const newRoot = list.replace(context.chapter, newList);
            if(newRoot === undefined) return;
            const newCaret = { node: second.getTextNodes()[0], index: 0 };
            return { root: newRoot, range: { start: newCaret, end: newCaret} };
        }
    },
    {
        description: "split paragraph",
        category: "paragraph",
        control: false, alt: false, shift: false, key: "Enter",
        visible: context => false,
        active: context => context.atom === undefined && context.blocks !== undefined,
        handler: context => context.chapter?.withSelectionSplit(context.range)
    },
    {
        label: "indent",
        icon: Indent,
        description: "indent list item",
        category: "list",
        control: false, alt: false, shift: false, key: "Tab",
        visible: context => context.list !== undefined,
        active: context => context.list !== undefined,
        handler: context => {
            if(context.blocks === undefined) return;
            const newBlocks = context.blocks.withListsIndented(context.range, true);
            if(newBlocks === undefined) return;
            const newRoot = context.blocks.replace(context.chapter, newBlocks);
            if(newRoot === undefined) return;
            return { root: newRoot, range: context.range }
        }
    },        
    {
        label: "unindent",
        icon: Unindent,
        description: "unindent list item",
        category: "list",
        control: false, alt: false, shift: true, key: "Tab",
        visible: context => context.list !== undefined,
        active: context => context.list !== undefined && context.list.isInside(context.chapter, ListNode),
        handler: context => {
            if(context.blocks === undefined) return;
            const newBlocks = context.blocks.withListsIndented(context.range, false);
            if(newBlocks === undefined) return;
            const newRoot = context.blocks.replace(context.chapter, newBlocks);
            if(newRoot === undefined) return;
            return { root: newRoot, range: context.range }
        }
    },
    {
        label: "plain",
        icon: Clear,
        description: "clear formatting",
        category: "text",
        control: true, alt: false, shift: false, key: "0",
        visible: context => true,
        active: context => context.chapter !== undefined && context.startIsText && context.endIsText,
        handler: context => context.chapter.withRangeFormatted(context.range, "")
    },
    {
        label: "bold",
        icon: Bold,
        description: "bold",
        category: "text",
        visible: context => true,
        control: true, alt: false, shift: false, key: "b",
        active: context => context.chapter !== undefined && context.startIsText && context.endIsText,
        handler: context => context.chapter.withRangeFormatted(context.range, "*")
    },
    {
        description: "italic",
        icon: Italic,
        category: "text",
        control: true, alt: false, shift: false, key: "i",
        visible: context => true,
        active: context => context.chapter !== undefined && context.startIsText && context.endIsText,
        handler: context => context.chapter.withRangeFormatted(context.range, "_")
    },
    {
        label: "<code>",
        icon: Code,
        description: "toggle code",
        category: "text",
        control: true, alt: false, shift: false, key: "j",
        visible: context => true,
        active: context => context.chapter !== undefined && context.startIsText && context.endIsText,
        handler: context => context.meta instanceof InlineCodeNode ? 
            unwrapMeta(context) : 
            context.chapter.withSegmentAtSelection(context.range, text => new InlineCodeNode(text))
    },
    {
        label: "sub\u2099",
        icon: Subscript,
        description: "subscript",
        category: "text",
        control: true, alt: false, shift: false, key: ",",
        visible: context => true,
        active: context => context.chapter !== undefined && context.startIsText && context.endIsText,
        handler: context => context.chapter.withRangeFormatted(context.range, "v")
    },
    {
        label: "super\u207F",
        icon: Superscript,
        description: "superscript",
        category: "text",
        control: true, alt: false, shift: false, key: ".",
        visible: context => true,
        active: context => context.chapter !== undefined && context.startIsText && context.endIsText,
        handler: context => context.chapter.withRangeFormatted(context.range, "^")
    },
    {
        label: "link ⚭",
        icon: Link,
        description: "link",
        category: "annotation",
        control: true, alt: false, shift: false, key: "k",
        visible: context => context.format !== undefined,
        active: context => context.chapter !== undefined && context.startIsText && context.endIsText,
        handler: context => context.meta instanceof LinkNode ? 
            unwrapMeta(context) : 
            context.chapter.withSegmentAtSelection(context.range, text => new LinkNode(text))
    },
    {
        label: "glossary",
        description: "toggle definition",
        category: "annotation",
        control: true, alt: false, shift: false, key: "d",
        visible: context => context.chapter !== undefined,
        active: context => context.startIsText && context.endIsText,
        handler: context => context.meta instanceof DefinitionNode ? 
            unwrapMeta(context) : 
            context.chapter.withSegmentAtSelection(context.range, text => new DefinitionNode(text))
    },
    {
        label: "footnote",
        description: "insert footnote",
        category: "annotation",
        control: true, alt: false, shift: false, key: "f",
        visible: context => context.chapter !== undefined,
        active: context => context.startIsText && context.endIsText,
        handler: context => context.chapter?.withSegmentAtSelection(context.range, text => new FootnoteNode(new FormatNode("", [ new TextNode(text) ])))
    },
    {
        label: "cite",
        description: "insert citations",
        category: "annotation",
        control: true, alt: false, shift: false, key: "t",
        visible: context => context.chapter !== undefined,
        active: context => context.chapter !== undefined && context.startIsText && context.endIsText,
        handler: context => context.chapter?.withSegmentAtSelection(context.range, text => new CitationsNode([]))
    },
    {
        label: "label",
        description: "insert label",
        category: "annotation",
        control: true, alt: false, shift: false, key: "l",
        visible: context => context.chapter !== undefined,
        active: context => context.chapter !== undefined && context.startIsText && context.endIsText,
        handler: context => context.chapter?.withSegmentAtSelection(context.range, text => new LabelNode(""))
    },
    {
        label: "comment",
        icon: Comment,
        description: "insert comment",
        category: "annotation",
        control: true, alt: false, shift: false, key: "c",
        visible: context => context.chapter !== undefined && context.atom === undefined,
        active: context => context.chapter !== undefined && context.atom === undefined && context.startIsText && context.endIsText,
        handler: context => context.chapter?.withSegmentAtSelection(context.range, text => new CommentNode(new FormatNode("", [ new TextNode(text) ])))
    },
    {
        label: "paragraph",
        icon: Paragraph,
        description: "format as paragraph",
        category: "level",
        control: true, alt: true, shift: false, code: "Digit0",
        visible: context => context.chapter !== undefined && context.atom === undefined,
        active: context => context.paragraph !== undefined && context.paragraph.getLevel() !== 0,
        handler: context => {
            if(context.paragraph === undefined || context.chapter === undefined) return;
            const newRoot = context.paragraph.replace(context.chapter, context.paragraph?.withLevel(0));
            if(newRoot)
                return { root: newRoot, range: context.range }
        }
    },
    {
        label: "h1",
        description: "format as 1st level header",
        category: "level",
        control: true, alt: true, shift: false, code: "Digit1",
        visible: context => context.chapter !== undefined && context.atom === undefined,
        active: context => context.paragraph !== undefined && context.paragraph.getLevel() !== 1,
        handler: context => {
            if(context.paragraph === undefined || context.chapter === undefined) return;
            const newRoot = context.paragraph.replace(context.chapter, context.paragraph?.withLevel(1));
            if(newRoot)
                return { root: newRoot, range: context.range }
        }
    },
    {
        label: "h2",
        description: "format as 2nd level header",
        category: "level",
        control: true, alt: true, shift: false, code: "Digit2",
        visible: context => context.chapter !== undefined && context.atom === undefined,
        active: context => context.paragraph !== undefined && context.paragraph.getLevel() !== 2,
        handler: context => {
            if(context.paragraph === undefined || context.chapter === undefined) return;
            const newRoot = context.paragraph.replace(context.chapter, context.paragraph?.withLevel(2));
            if(newRoot)
                return { root: newRoot, range: context.range }
        }
    },
    {
        label: "h3",
        description: "format as 3rd level header",
        category: "level",
        control: true, alt: true, shift: false, code: "Digit3",
        visible: context => context.chapter !== undefined && context.atom === undefined,
        active: context => context.paragraph !== undefined && context.paragraph.getLevel() !== 3,
        handler: context => {
            if(context.paragraph === undefined || context.chapter === undefined) return;
            const newRoot = context.paragraph.replace(context.chapter, context.paragraph?.withLevel(3));
            if(newRoot)
                return { root: newRoot, range: context.range }
        }
    },
    {
        label: "\u2014",
        description: "insert horizontal rule",
        category: "block",
        control: true, alt: false, shift: true, key: "h",
        visible: context => context.blocks !== undefined && context.atParagraphStart,
        active: context => context.blocks !== undefined && context.atParagraphStart,
        handler: context => {
            if(context.blocks && context.paragraph) {
                const newRoot = insertBlock(context, new RuleNode());
                if(newRoot)
                    return{ root: newRoot, range: context.range };
            }
        } 
    },
    {
        label: "callout",
        description: "insert callout",
        category: "block",
        control: true, alt: false, shift: true, key: "e",
        visible: context => context.blocks !== undefined && context.atParagraphStart,
        active: context => context.blocks !== undefined && context.atParagraphStart,
        handler: context => {
            // If the caret is in a paragraph in a blocks node, insert a callout before the current paragraph.
            if(context.blocks && context.paragraph) {
                // Make a new callout node with an empty paragraph, insert it before the paragraph the caret is in, and place the caret inside the empty paragraph.
                const newParagraph = new ParagraphNode();
                const newCallout = new CalloutNode([ newParagraph ]);
                const newCaret = { node: newParagraph.getContent().getSegments()[0], index: 0 };
                const newRoot = insertBlock(context, newCallout);
                if(newRoot)
                    return { root: newRoot, range: { start: newCaret, end: newCaret } };
            }
        } 
    },
    {
        label: "‟",
        icon: Quote,
        description: "insert quote",
        category: "block",
        control: true, alt: false, shift: true, key: "u",
        visible: context => context.blocks !== undefined && context.atParagraphStart,
        active: context => context.blocks !== undefined && context.atParagraphStart,
        handler: context => {
            if(context.blocks && context.paragraph) {
                // Make a new quote and place the caret inside the quote's first empty paragraph.
                const newParagraph = new ParagraphNode();
                const newQuote = new QuoteNode([ newParagraph ]);
                const newText = newParagraph.getContent().getSegments()[0];
                const newCaret = { node: newText, index: 0 };
                const newRoot = insertBlock(context, newQuote);
                if(newRoot)
                    return { root: newRoot, range: { start: newCaret, end: newCaret } };
            }
        } 
    },
    {
        label: "<code>",
        icon: Code,
        description: "insert code",
        category: "block",
        control: true, alt: false, shift: true, key: "s",
        visible: context => context.blocks !== undefined && context.atParagraphStart,
        active: context => context.blocks !== undefined && context.atParagraphStart,
        handler: context => {
            if(context.blocks && context.paragraph) {
                // Place the caret inside the code's code node.
                const newCode = new CodeNode("", "plaintext", "|");
                const newCaret = { node: newCode.getCodeNode(), index: 0 };
                const newRoot = insertBlock(context, newCode);
                if(newRoot)
                    return { root: newRoot, range: { start: newCaret, end: newCaret } };
            }
        } 
    },
    {
        label: "image/video",
        icon: Media,
        description: "insert image or video",
        category: "block",
        control: true, alt: false, shift: true, key: "p",
        visible: context => context.blocks !== undefined && context.atParagraphStart,
        active: context => context.blocks !== undefined && context.atParagraphStart,
        handler: context => {
            if(context.blocks && context.paragraph) {
                // Place the caret inside the code's code node.
                const newEmbed = new EmbedNode("", "");
                const text = newEmbed.getCaption().getFirstTextNode();
                const newCaret = { node: text, index: 0 };
                const newRoot = insertBlock(context, newEmbed);
                if(newRoot)
                    return { root: newRoot, range: { start: newCaret, end: newCaret } };
            }
        } 
    },
    {
        label: "table",
        description: "insert table",
        category: "block",
        control: true, alt: false, shift: true, key: "\\",
        visible: context => context.blocks !== undefined && context.atParagraphStart,
        active: context => context.blocks !== undefined && context.atParagraphStart,
        handler: context => {
            if(context.blocks && context.paragraph) {
                // Create a 3x3 of table rows and columns
                // Return a caret corresponding to the first cell.
                const newRows: FormatNode[][] = [[], [], []];
                for(let r = 0; r < Math.max(1, 3); r++) {
                    for(let c = 0; c < Math.max(1, 3); c++)
                        newRows[r].push(new FormatNode("", [ new TextNode("")]));
                }
                const newTable = new TableNode(newRows, "|", new FormatNode("", [ new TextNode("")]));
                const newCaret = { node: newTable.getRows()[0][0].getTextNodes()[0], index: 0 };
                const newRoot = insertBlock(context, newTable);
                if(newRoot)
                    return { root: newRoot, range: { start: newCaret, end: newCaret } };
            }
        } 
    },
    {
        label: "bulleted",
        icon: Bullets,
        description: "convert paragraph to bulleted list item",
        category: "list",
        control: true, alt: false, shift: true, key: "7",
        visible: context => context.list === undefined && context.atom === undefined,
        active: context => context.list === undefined && context.atom === undefined && context.blocks !== undefined,
        handler: context => {
            const newBlocks = context.blocks?.withParagraphsAsLists(context.range, false);
            if(newBlocks === undefined) return;
            const newRoot = context.blocks?.replace(context.chapter, newBlocks);
            if(newRoot === undefined) return;
            return { root: newRoot, range: context.range };
        }
    },
    {
        label: "numbered",
        icon: Numbers,
        description: "convert paragraph to numbered list item",
        category: "list",
        control: true, alt: false, shift: true, key: "8",
        visible: context => context.list === undefined && context.atom === undefined,
        active: context => context.list === undefined && context.atom === undefined && context.blocks !== undefined,
        handler: context => {
            const newBlocks = context.blocks?.withParagraphsAsLists(context.range, false);
            if(newBlocks === undefined) return;
            const newRoot = context.blocks?.replace(context.chapter, newBlocks);
            if(newRoot === undefined) return;
            return { root: newRoot, range: context.range };
        }
    },
    {
        label: "bulleted",
        icon: Bullets,
        description: "convert numbered list item to bulleted",
        category: "list",
        control: true, alt: false, shift: true, key: "7",
        visible: context => context.blocks !== undefined && context.list !== undefined && context.list.isNumbered(),
        active: context => context.list !== undefined && context.list.isNumbered(),
        handler: context => {
            if(!context.list || !context.blocks) return;
            const newBlocks = context.blocks?.withListAsStyle(context.list, false);
            if(newBlocks === undefined) return;
            const newRoot = context.chapter.withDescendantReplaced(context.blocks, newBlocks);
            if(newRoot === undefined) return;
            return { root: newRoot, range: context.range };
        }
    },
    {
        label: "numbered",
        icon: Numbers,
        description: "convert bulleted list item to numbered",
        category: "list",
        control: true, alt: false, shift: true, key: "8",
        visible: context => context.blocks !== undefined && context.list !== undefined && !context.list.isNumbered(),
        active: context => context.list !== undefined && !context.list.isNumbered(),
        handler: context => {
            if(!context.list || !context.blocks) return;
            const newBlocks = context.blocks?.withListAsStyle(context.list, true);
            if(newBlocks === undefined) return;
            const newRoot = context.chapter.withDescendantReplaced(context.blocks, newBlocks);
            if(newRoot === undefined) return;
            return { root: newRoot, range: context.range };
        }
    },
    {
        label: "paragraph",
        icon: Paragraph,
        description: "convert bulleted list item to paragraph",
        category: "list",
        control: true, alt: false, shift: true, key: ["7", "8"],
        visible: context => context.includesList,
        active: context => context.includesList,
        handler: context => {
            if(context.blocks === undefined) return;
            const newBlocks = context.blocks.withListsAsParagraphs(context.range);
            if(newBlocks === undefined) return;
            const newRoot = context.blocks.replace(context.chapter, newBlocks);
            if(newRoot === undefined) return;
            return { root: newRoot, range: context.range }
        }
    },
    {
        label: "undo",
        icon: Undo,
        description: "undo the last command",
        category: "history",
        control: true, alt: false, shift: false, key: ["z"],
        visible: context => true,
        active: context => context.undoStack.length > 0 && context.undoPosition < context.undoStack.length - 1,
        handler: context => context.undo()
    },
    {
        label: "redo",
        icon: Redo,
        description: "redo the most recently undone command",
        category: "history",
        control: true, alt: false, shift: true, key: ["z"],
        visible: context => true,
        active: context => context.undoPosition > 0,
        handler: context => context.redo()
    },
    {
        label: "insert",
        description: "insert character",
        category: "text",
        control: false, alt: false, shift: undefined, key: undefined,
        visible: context => false,
        active: (context, key) => key !== undefined && key.length === 1,
        handler: (context, utilities, key) => {
            const range = context.range;
            const char = key;
            if(context.chapter && range instanceof TextNode && char.length === 1) {

                // Insert at the start.
                let insertionPoint = range.start;
        
                // If there's a selection, remove it before inserting, and insert at the caret returned.
                if (range.start.node !== range.end.node || range.start.index !== range.end.index) {
                    // Try to remove the range.
                    let edit = context.chapter.withoutRange(range);
                    // If we fail, fail to insert at the selection.
                    if(edit === undefined)
                        return;
                    insertionPoint = edit.range.start;
                }
        
                // Not a text node? Fail.
                if(!(insertionPoint.node instanceof TextNode)) return;
        
                // Update the chapter with the new text node.
                const newText = insertionPoint.node.withCharacterAt(char, insertionPoint.index);
                if(newText === undefined) return;
                const newRoot = insertionPoint.node.replace(context.chapter, newText);
                if(newRoot === undefined) return;
                const newCaret = { node: newText, index: insertionPoint.index + 1 };
                return { root: newRoot, range: { start: newCaret, end: newCaret } };
    
            }
        }
    }
];