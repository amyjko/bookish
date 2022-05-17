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
    active: (context: CaretState) => boolean,
    handler: (
        context: CaretState,
        utilities: CaretUtilities,
        key: string) => CaretRange
}

function insertTableRowColumn(table: TableNode, format: FormatNode, row: boolean, before: boolean): CaretRange | undefined {
    const location = table.locate(format);
    if(location) {
        if(row)
            table.addRow(location.row + (before ? 0 : 1));
        else   
            table.addColumn(location.column + (before ? 0 : 1));
        const newFormat = table.getCell(location.row + (row && !before ? 1 : 0), location.column + (!row && !before ? 1 : 0));
        if(newFormat) {
            const newCaret = { node: newFormat.getTextNodes()[0], index: 0 };
            return { start: newCaret, end: newCaret };
        }
    }
    return undefined;
}

function deleteTableRowColumn(table: TableNode, format: FormatNode, row: boolean): CaretRange | undefined {
    const location = table.locate(format);
    if(!location) return undefined;
    if(row)
        table.deleteRow(location.row);
    else
        table.deleteColumn(location.column);
    const newFormat = row ?
        table.getCell(location.row === table.getRowCount() ? location.row - 1 : location.row, location.column) :
        table.getCell(location.row, location.column === table.getColumnCount() ? location.column - 1 : location.column)
    if(!newFormat) return undefined;
    const newCaret = { node: newFormat.getTextNodes()[0], index: 0 };
    return { start: newCaret, end: newCaret };    

}

function convertRangeToListItem(range: CaretRange, numbered: boolean): CaretRange {
    // Find the common ancestor of the selection.
    const ancestor = range.start.node.getCommonAncestor(range.end.node);
    const paragraph = ancestor?.getParent();
    const blocks = paragraph?.getParent();

    // If the common ancestor is a format in a paragraph, convert it to a list.
    if(ancestor instanceof FormatNode && paragraph instanceof ParagraphNode && blocks instanceof BlocksNode) {
        const newList = new ListNode(blocks, [], numbered);
        const format = paragraph.getContent();
        newList.append(format);
        paragraph.replaceWith(newList);
    }
    // If the common ancestor is a blocks node, convert all of the paragraphs in range to a list.
    else if(ancestor instanceof BlocksNode) {
        // Find all the paragraphs in the section.
        let first = range.start.node instanceof TextNode && range.start.node.getParagraph();
        let last = range.end.node instanceof TextNode && range.end.node.getParagraph();
        if(first && last) {
            const blocks = ancestor.getBlocksBetween(first, last);            
            if(blocks) {
                const paragraphs = blocks.filter(b => b instanceof ParagraphNode) as ParagraphNode[];
                // Only format if it's a contiguous list of paragraphs.
                if(blocks.length === paragraphs.length) {
                    const newList = new ListNode(ancestor, [], numbered);
                    ancestor.insertBefore(paragraphs[0], newList);
                    paragraphs.forEach(p => {
                        newList.append(p.getContent());
                        p.remove();
                    });
                }
            }
        }
    }

    // Keep the range at the same location.
    return range;
}

// Given an arbitrary selection, find all of the root list nodes within bounds
// and convert any list items within the selection to paragraphs. The general
// approach is to find all lists, and for the lists containing the start or end caret,
// duplicate the list and convert everything included to paragraphs, and for all of the lists
// between the start or end caret, convert the entire list to a paragraph.
function unwrapListItems(range: CaretRange): CaretRange {

    // Find the lists in range. The approach is to find all of the formats and all of the
    // root list nodes of those formats. They have to be in the same document.
    const ancestor = range.start.node.getCommonAncestor(range.end.node);
    if(ancestor === undefined)
        return range;

    // Find the formats that the range start and stop in.
    const startFormat = range.start.node.getClosestParentMatching(p => p instanceof FormatNode) as FormatNode;
    const endFormat = range.end.node.getClosestParentMatching(p => p instanceof FormatNode) as FormatNode;
    const blocks = ancestor instanceof BlocksNode ? ancestor : ancestor.getClosestParentMatching(p => p instanceof BlocksNode) as BlocksNode;

    if(startFormat && endFormat && blocks) {
        // Find all the formats in the common ancestor.
        const formats: FormatNode[] = ancestor.getNodes().filter(p => p instanceof FormatNode) as FormatNode[];

        // Sort the start and end format.
        const reversed = formats.indexOf(startFormat) > formats.indexOf(endFormat);
        const firstFormat = reversed ? endFormat : startFormat;
        const lastFormat = reversed ? startFormat : endFormat;

        // Loop through the formats in order and find the lists and list items that are contained in the selection.
        let inside = false;
        const listsToUnwrap: { list: ListNode, formats: FormatNode[] }[] = [];
        formats.forEach(format => {
            if(format === firstFormat)
                inside = true;
            if(inside) {
                // Find the root list that contains the format.
                const list = format.getFarthestParentMatching(n => n instanceof ListNode) as ListNode;
                if(list !== undefined) {
                    const listFormats = listsToUnwrap.find(f => f.list === list);
                    if(listFormats)
                        listFormats.formats.push(format);
                    else
                        listsToUnwrap.push({ list: list, formats: [ format ]});
                }
            }
            if(format === lastFormat)
                inside = false;
        });

        // Translate each existing list into a sequence of paragraphs and lists reflecting the desired edits,
        // then insert after the existing list, then remove the existing list.
        listsToUnwrap.forEach(set => {
            set.list.unwrap(set.formats, blocks).reverse().forEach(block => blocks.insertAfter(set.list, block));
            set.list.remove();
        });

    }

    // Return the original range, since the format it was in should still exist.
    return range;

}

function dentListItems(range: CaretRange, indent: boolean) {
    // Find all of the formats in the range and indent them.
    const ancestor = range.start.node.getCommonAncestor(range.end.node);
    const nodes = ancestor?.getNodes();            
    const formats = nodes?.filter(n => n instanceof FormatNode && n.getParent() instanceof ListNode) as FormatNode[];
    const startIndex = nodes?.indexOf(range.start.node);
    const endIndex = nodes?.indexOf(range.end.node);
    if(formats === undefined || startIndex === undefined || endIndex === undefined)
        return;
    const first = startIndex < endIndex ? range.start.node : range.end.node;
    const last = startIndex < endIndex ? range.end.node : range.start.node;
    let inside = false;
    formats.forEach(format => {
        if(first.hasAncestor(format))
            inside = true;
        if(inside) {
            const list = format.getParent();
            if(list instanceof ListNode)
                indent ? list.indent(format) : list.unindent(format);
        }
        if(last.hasAncestor(format))
            inside = false;
    });
}

function mergeAdjacentLists(blocks: BlocksNode) {

    const newBlocks: BlockNode[] = [];
    blocks.getBlocks().forEach(block => {
        const previousBlock = newBlocks[newBlocks.length - 1];
        if(previousBlock instanceof ListNode && block instanceof ListNode && previousBlock.isNumbered() === block.isNumbered()) {
            block.getItems().forEach(item => {
                previousBlock.append(item);
            });
        }
        else {
            newBlocks.push(block);
        }
    });

    blocks.blocks = newBlocks;

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
            if(!context.table || !context.format) return context.range;
            const range = insertTableRowColumn(context.table, context.format, true, true);
            return range ? range : context.range;
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
            if(!context.table || !context.format) return context.range;
            const range = insertTableRowColumn(context.table, context.format, true, false);
            return range ? range : context.range;
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
            if(!context.table || !context.format) return context.range;
            const range = insertTableRowColumn(context.table, context.format, false, false);
            return range ? range : context.range;
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
            if(!context.table || !context.format) return context.range;
            const range = insertTableRowColumn(context.table, context.format, false, true);
            return range ? range : context.range;
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
            if(!context.table || !context.format) return context.range;
            const range = deleteTableRowColumn(context.table, context.format, true);
            return range ? range : context.range;
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
            if(!context.table || !context.format) return context.range;
            const range = deleteTableRowColumn(context.table, context.format, false);
            return range ? range : context.range;
        }
    },
    {
        description: "move to previous character",
        category: "navigation",
        control: false, alt: false, shift: false, key: "ArrowLeft",
        visible: context => false,
        active: context => context.endIsTextOrAtom,
        handler: context => {
            const previous = (context.end.node as TextNode).previous(context.end.index);
            return { start: previous, end: previous };
        }
    },
    {
        description: "move to previous word",
        category: "navigation",
        control: false, alt: true, shift: false, key: "ArrowLeft",
        visible: context => false,
        active: context => context.endIsTextOrAtom,
        handler: context => {
            const previous = (context.end.node as TextNode).previousWord(context.end.index);
            return { start: previous, end: previous };
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
            return { start: { node: first, index: 0 }, end: { node: first, index: 0 }};
        }
    },
    {
        description: "expand selection to previous character",
        category: "selection",
        control: false, alt: false, shift: true, key: "ArrowLeft",
        visible: context => false,
        active: context => context.endIsTextOrAtom,
        handler: context => {
            const previous = (context.end.node as TextNode).previous(context.end.index);
            return { start: context.start, end: previous };
        }
    },
    {
        description: "expand selection to previous word",
        category: "selection",
        control: false, alt: true, shift: true, key: "ArrowLeft",
        visible: context => false,
        active: context => context.endIsTextOrAtom,
        handler: context => {
            const previous = (context.end.node as TextNode).previousWord(context.end.index);
            return { start: context.start, end: previous };
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
            return { start: context.start, end: { node: first, index: 0 } };
        }
    },
    {
        description: "move to next character",
        category: "navigation",
        control: false, alt: false, shift: false, key: "ArrowRight",
        visible: context => false,
        active: context => context.endIsTextOrAtom,
        handler: context => {
            const next = (context.end.node as TextNode).next(context.end.index);
            return { start: next, end: next };
        }
    },
    {
        description: "move to next word",
        category: "navigation",
        control: false, alt: true, shift: false, key: "ArrowRight",
        visible: context => false,
        active: context => context.endIsTextOrAtom,
        handler: context => {
            const next = (context.end.node as TextNode).nextWord(context.end.index);
            return { start: next, end: next };
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
            return { start: caret, end: caret};
        }
    },
    {
        description: "expand selection to next character",
        category: "selection",
        control: false, alt: false, shift: true, key: "ArrowRight",
        visible: context => false,
        active: context => context.endIsTextOrAtom,
        handler: context => {
            const previous = (context.end.node as TextNode).next(context.end.index);
            return { start: context.start, end: previous };
        }
    },
    {
        description: "expand selection to next word",
        category: "selection",
        control: false, alt: true, shift: true, key: "ArrowRight",
        visible: context => false,
        active: context => context.endIsTextOrAtom,
        handler: context => {
            const previous = (context.end.node as TextNode).nextWord(context.end.index);
            return { start: context.start, end: previous };
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
            return { start: context.start, end: { node: last, index: last.getLength() } };
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
                return { start: format.getFirstCaret(), end: format.getLastCaret() };
            }
            else {
                // Find the first and last caret of the entire chapter.
                const text = context.chapter?.getTextNodes();
                if(text && text.length > 0) {
                    return {
                        start: { node: text[0], index: 0 },
                        end: { node: text[text.length - 1], index: text[text.length - 1].getLength() }
                    }
                }
                return context.range;
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
            return { start: above, end: above };
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
            return { start: context.start, end: above };
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
            return { start: below, end: below };
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
            return { start: context.start, end: below };
        }
    },
    {
        description: "delete list item",
        category: "list",
        control: false, alt: false, shift: false, key: "Backspace",
        visible: context => false,
        active: context => context.list?.atBeginningOfItem(context.start) === true,
        handler: context => {
            const list = context.start.node.getClosestParentMatching(p => p instanceof ListNode) as ListNode;
            const newCaret = list.backspaceItemContaining(context.start);
            return { start: newCaret, end: newCaret };
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
                const firstCaret = context.start.node.getFormatRoot()?.getFirstCaret();
                if(firstCaret && firstCaret.node === context.start.node && firstCaret.index === context.start.index) {
                    const blocks = context.start.node.getBlocks();
                    const currentParagraph = context.start.node.getParagraph();
                    if(currentParagraph && blocks) {
                        if(currentParagraph instanceof ParagraphNode) {
                            const previousBlock = blocks.getSiblingOf(currentParagraph, false);
                            // If the block before this paragraph is a paragraph, merge the paragraphs.
                            if(previousBlock instanceof ParagraphNode) {
                                const lastIndex = previousBlock.getContent().caretToTextIndex(previousBlock.getLastCaret());
                                previousBlock.appendParagraph(currentParagraph);
                                const lastCaret = previousBlock.getContent().textIndexToCaret(lastIndex);
                                if(lastCaret)
                                    return { start: lastCaret, end: lastCaret };    
                            }
                            // If the block before is a list node, merge the current paragraph to the last list item.
                            else if(previousBlock instanceof ListNode) {
                                const lastFormat = previousBlock.getLastItem();
                                if(lastFormat) {
                                    const newCaret = lastFormat.getLastCaret();
                                    lastFormat.addSegment(currentParagraph.getContent().copy(lastFormat));
                                    currentParagraph.remove();
                                    return { start: newCaret, end: newCaret };
                                }
                            }
                            // Otherwise, delete the block.
                            else {
                                previousBlock?.remove();
                                return context.range;
                            }
                        }
                    }
                    // Do nothing if there's no blocks node.
                    return context.range;
                }
                // Otherwise, if the current caret isn't a selection, expand the range to select the previous caret position to delete it.
                if(context.end.node instanceof TextNode || context.end.node instanceof AtomNode)
                    context.end = context.end.node.previous(context.end.index);

            }
            const caret = (context.chapter as ChapterNode).removeRange({ start: context.start, end: context.end });
            return { start: caret, end: caret };
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
                const lastCaret = context.start.node.getFormatRoot()?.getLastCaret();
                if(lastCaret && lastCaret.node === context.start.node && lastCaret.index === context.start.index) {
                    const blocks = context.start.node.getBlocks();
                    const currentParagraph = context.start.node.getParagraph();
                    if(currentParagraph && blocks) {
                        if(currentParagraph instanceof ParagraphNode) {
                            const nextBlock = blocks.getSiblingOf(currentParagraph, true);
                            if(nextBlock instanceof ParagraphNode) {
                                const firstIndex = currentParagraph.getContent().caretToTextIndex(currentParagraph.getLastCaret());
                                currentParagraph.appendParagraph(nextBlock);
                                const firstCaret = currentParagraph.getContent().textIndexToCaret(firstIndex);
                                if(firstCaret)
                                    return { start: firstCaret, end: firstCaret };    
                            }
                            // If the block before is a list node, merge the current paragraph to the last list item.
                            else if(nextBlock instanceof ListNode) {
                                const firstFormat = nextBlock.getFirstItem();
                                if(firstFormat) {
                                    const newCaret = currentParagraph.getLastCaret();
                                    currentParagraph.getContent().addSegment(firstFormat.copy(currentParagraph.getContent()));
                                    // Delete the first item.
                                    firstFormat.remove();
                                    return { start: newCaret, end: newCaret };
                                }
                            }
                            else {
                                nextBlock?.remove();
                                return context.range;
                            }
                        }
                    }
                    // Do nothing if there's no blocks node.
                    return context.range;
                }
                // Otherwise, if the current caret isn't a selection, expand the range to select the previous caret position to delete it.
                if(context.end.node instanceof TextNode || context.end.node instanceof AtomNode)
                    context.end = context.end.node.next(context.end.index);
            }
            const caret = (context.chapter as ChapterNode).removeRange({ start: context.start, end: context.end });
            return { start: caret, end: caret };
        }
    },
    {
        description: "insert code newline",
        category: "text",
        control: false, alt: false, shift: false, key: "Enter",
        visible: context => false,
        active: context => context.start.node.getParent() instanceof CodeNode,
        handler: context => {
            const caret = (context.start.node as TextNode).insert("\n", context.start.index);
            return { start: caret, end: caret }
        }
    },
    {
        description: "split list item",
        category: "list",
        control: false, alt: false, shift: false, key: "Enter",
        visible: context => false,
        active: context => context.start.node.getClosestParentMatching(p => p instanceof ListNode) !== undefined,
        handler: context => {
            const list = context.start.node.getClosestParentMatching(p => p instanceof ListNode) as ListNode;
            const format = context.start.node.getClosestParentMatching(p => p instanceof FormatNode) as FormatNode;
            const parts = format.split(context.start);            
            if(!list || !parts)
                return context.range;
            const [ first, second ] = parts;
            format.replaceWith(first);
            list.insertAfter(second, first);
            const caret = { node: second.getTextNodes()[0], index: 0};
            return { start: caret, end: caret};
        }
    },
    {
        description: "split paragraph",
        category: "paragraph",
        control: false, alt: false, shift: false, key: "Enter",
        visible: context => false,
        active: context => context.atom === undefined && context.chapter !== undefined,
        handler: context => {
            const caret = (context.chapter as ChapterNode).splitSelection(context.range);
            return { start: caret, end: caret };
        }
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
            dentListItems(context.range, true);
            return { start: context.start, end: context.end };
        }
    },        
    {
        label: "unindent",
        icon: Unindent,
        description: "unindent list item",
        category: "list",
        control: false, alt: false, shift: true, key: "Tab",
        visible: context => context.list !== undefined,
        active: context => context.list !== undefined && context.list.getParent() instanceof ListNode,
        handler: context => {
            dentListItems(context.range, false);
            return { start: context.start, end: context.end };
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
        handler: context => context.chapter ? context.chapter.editRange(context.range, "") : context.range
    },
    {
        label: "bold",
        icon: Bold,
        description: "bold",
        category: "text",
        visible: context => true,
        control: true, alt: false, shift: false, key: "b",
        active: context => context.chapter !== undefined && context.startIsText && context.endIsText,
        handler: context => context.chapter ? context.chapter.editRange(context.range, "*") : context.range
    },
    {
        description: "italic",
        icon: Italic,
        category: "text",
        control: true, alt: false, shift: false, key: "i",
        visible: context => true,
        active: context => context.chapter !== undefined && context.startIsText && context.endIsText,
        handler: context => context.chapter ? context.chapter.editRange(context.range, "_") : context.range
    },
    {
        label: "<code>",
        icon: Code,
        description: "toggle code",
        category: "text",
        control: true, alt: false, shift: false, key: "j",
        visible: context => true,
        active: context => context.chapter !== undefined && context.startIsText && context.endIsText,
        handler: context => {
            const caret = context.chapter?.toggleAtom(context.range, InlineCodeNode, (parent, text) => new InlineCodeNode(parent, text));
            return caret ? { start: caret, end: caret} : context.range;
        }
    },
    {
        label: "sub\u2099",
        icon: Subscript,
        description: "subscript",
        category: "text",
        control: true, alt: false, shift: false, key: ",",
        visible: context => true,
        active: context => context.chapter !== undefined && context.startIsText && context.endIsText,
        handler: context => context.chapter ? context.chapter.editRange(context.range, "v") : context.range
    },
    {
        label: "super\u207F",
        icon: Superscript,
        description: "superscript",
        category: "text",
        control: true, alt: false, shift: false, key: ".",
        visible: context => true,
        active: context => context.chapter !== undefined && context.startIsText && context.endIsText,
        handler: context => context.chapter ? context.chapter.editRange(context.range, "^") : context.range
    },
    {
        label: "link ⚭",
        icon: Link,
        description: "toggle link",
        category: "annotation",
        control: true, alt: false, shift: false, key: "k",
        visible: context => true,
        active: context => context.chapter !== undefined && context.startIsText && context.endIsText,
        handler: context => {
            const caret = context.chapter?.toggleAtom(context.range, LinkNode, (parent, text) => new LinkNode(parent, text));
            return caret ? { start: caret, end: caret} : context.range;
        }
    },
    {
        label: "glossary",
        description: "toggle definition",
        category: "annotation",
        control: true, alt: false, shift: false, key: "d",
        visible: context => context.chapter !== undefined,
        active: context => context.startIsText && context.endIsText,
        handler: context => {
            const caret = context.chapter?.toggleAtom(context.range, DefinitionNode, (parent, text) => new DefinitionNode(parent, text));
            return caret ? { start: caret, end: caret} : context.range;
        }
    },
    {
        label: "footnote",
        description: "insert footnote",
        category: "annotation",
        control: true, alt: false, shift: false, key: "f",
        visible: context => context.chapter !== undefined,
        active: context => context.startIsText && context.endIsText,
        handler: context => {
            const caret = context.chapter?.insertNodeAtSelection(context.range, (parent, text) => new FootnoteNode(parent, text));
            const footnote = caret?.node as FootnoteNode;
            const first = footnote?.getMeta().getFirstCaret();
            return first ? { start: first, end: first } : context.range;
        }
    },
    {
        label: "cite",
        description: "insert citations",
        category: "annotation",
        control: true, alt: false, shift: false, key: "t",
        visible: context => context.chapter !== undefined,
        active: context => context.chapter !== undefined && context.startIsText && context.endIsText,
        handler: context => {
            const caret = context.chapter?.insertNodeAtSelection(context.range, (parent, text) => new CitationsNode(parent, []));
            return caret ? { start: caret, end: caret} : context.range;
        }
    },
    {
        label: "label",
        description: "insert label",
        category: "annotation",
        control: true, alt: false, shift: false, key: "l",
        visible: context => context.chapter !== undefined,
        active: context => context.chapter !== undefined && context.startIsText && context.endIsText,
        handler: context => {
            const caret = context.chapter?.insertNodeAtSelection(context.range, (parent, text) => new LabelNode(parent, ""));
            return caret ? { start: caret, end: caret} : context.range;
        }
    },
    {
        label: "comment",
        icon: Comment,
        description: "insert comment",
        category: "annotation",
        control: true, alt: false, shift: false, key: "c",
        visible: context => context.chapter !== undefined && context.atom === undefined,
        active: context => context.chapter !== undefined && context.atom === undefined && context.startIsText && context.endIsText,
        handler: context => {
            const caret = context.chapter?.insertNodeAtSelection(context.range, (parent, text) => {
                const format = new FormatNode(parent, "", []);
                format.addSegment(new TextNode(format, ""));
                return new CommentNode(parent, format);
            });
            const comment = caret?.node as CommentNode;
            const first = comment?.getMeta().getFirstCaret();
            return first ? { start: first, end: first } : context.range;
        }
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
            context.paragraph?.setLevel(0);
            return context.range;
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
            context.paragraph?.setLevel(1);
            return context.range;
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
            context.paragraph?.setLevel(2);
            return context.range;
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
            context.paragraph?.setLevel(3);
            return context.range;
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
            if(context.blocks && context.paragraph)
                context.blocks.insertBefore(context.paragraph, new RuleNode(context.blocks));
            return context.range;
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
            if(context.blocks && context.paragraph) {
                const callout = new CalloutNode(context.blocks, []);
                const newParagraph = new ParagraphNode(callout);
                callout.append(newParagraph);
                context.blocks.insertBefore(context.paragraph, callout);
                const newText = newParagraph.getContent().getSegments()[0];
                // Place the caret inside the callout's first paragraph.
                return { start: { node: newText, index: 0}, end: { node: newText, index: 0 } };
            }
            return context.range;
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
                const quote = new QuoteNode(context.blocks, []);
                const newParagraph = new ParagraphNode(quote);
                quote.append(newParagraph);
                context.blocks.insertBefore(context.paragraph, quote);
                const newText = newParagraph.getContent().getSegments()[0];
                // Place the caret inside the callout's first paragraph.
                return { start: { node: newText, index: 0}, end: { node: newText, index: 0 } };
            }
            return context.range;
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
                const code = new CodeNode(context.blocks, "", "plaintext", "|");
                context.blocks.insertBefore(context.paragraph, code);
                // Place the caret inside the code's code node.
                return { start: { node: code.getCodeNode(), index: 0}, end: { node: code.getCodeNode(), index: 0 } };
            }
            return context.range;
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
                const embed = new EmbedNode(context.blocks, "", "");
                context.blocks.insertBefore(context.paragraph, embed);
                // Place the caret inside the code's code node.
                const text = embed.getCaption().getFirstTextNode();
                if(text) {
                    const caret = { node: text, index: 0 };
                    return { start: caret, end: caret };
                }
            }
            return context.range;
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
                const table = new TableNode(context.blocks, []);

                // Add some rows and columns, relying on the table
                for(let r = 0; r < Math.max(1, 3); r++) table.addRow(0);
                for(let c = 0; c < Math.max(1, 3); c++) table.addColumn(0);

                // Set a default caption
                const caption = new FormatNode(table, "", []);
                caption.addSegment(new TextNode(caption, ""));
                table.setCaption(caption);

                // Insert table
                context.blocks.insertBefore(context.paragraph, table);

                // // Return a caret corresponding to the first cell.
                const caret = { node: table.getRows()[0][0].getTextNodes()[0], index: 0 };
                return { start: caret, end: caret };
            }
            return context.range;
        } 
    },
    {
        label: "bulleted",
        icon: Bullets,
        description: "convert paragraph to bulleted list item",
        category: "list",
        control: true, alt: false, shift: true, key: "7",
        visible: context => context.list === undefined && context.atom === undefined,
        active: context => context.list === undefined && context.atom === undefined,
        handler: context => {
            if(!context.blocks) return context.range;
            const newCaret = convertRangeToListItem(context.range, false);
            if(context.blocks) 
                mergeAdjacentLists(context.blocks);
            return newCaret;
        }
    },
    {
        label: "numbered",
        icon: Numbers,
        description: "convert paragraph to numbered list item",
        category: "list",
        control: true, alt: false, shift: true, key: "8",
        visible: context => context.list === undefined && context.atom === undefined,
        active: context => context.list === undefined && context.atom === undefined,
        handler: context => {
            if(!context.blocks) return context.range;            
            const newCaret = convertRangeToListItem(context.range, true);
            if(context.blocks) 
                mergeAdjacentLists(context.blocks);
            return newCaret;
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
            if(!context.list) return context.range;
            context.list.setNumbered(false);
            if(context.blocks) 
                mergeAdjacentLists(context.blocks);
            return context.range;
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
            if(!context.list) return context.range;
            context.list.setNumbered(true);
            if(context.blocks) 
                mergeAdjacentLists(context.blocks);
            return context.range;
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
            return unwrapListItems(context.range);
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
        handler: context => {
            return context.undo();
        }
    },
    {
        label: "redo",
        icon: Redo,
        description: "redo the most recently undone command",
        category: "history",
        control: true, alt: false, shift: true, key: ["z"],
        visible: context => true,
        active: context => context.undoPosition > 0,
        handler: context => {
            return context.redo();
        }
    },
    {
        label: "insert",
        description: "insert character",
        category: "text",
        control: false, alt: false, shift: undefined, key: undefined,
        visible: context => false,
        active: context => true,
        handler: (context, utilities, key) => {
            if(context.chapter && key.length === 1) {
                const caret = context.chapter.insertSelection(key, context.range);
                return { start: caret, end: caret };
            }
            else return context.range;
        }
    }
];