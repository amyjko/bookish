import { CalloutNode } from "../../models/chapter/CalloutNode";
import { Caret } from "../../models/chapter/Caret";
import { CitationsNode } from "../../models/chapter/CitationsNode";
import { CodeNode } from "../../models/chapter/CodeNode";
import { CommentNode } from "../../models/chapter/CommentNode";
import { DefinitionNode } from "../../models/chapter/DefinitionNode";
import { EmbedNode } from "../../models/chapter/EmbedNode";
import { FootnoteNode } from "../../models/chapter/FootnoteNode";
import { FormatNode } from "../../models/chapter/FormatNode";
import { InlineCodeNode } from "../../models/chapter/InlineCodeNode";
import { LabelNode } from "../../models/chapter/LabelNode";
import { LinkNode } from "../../models/chapter/LinkNode";
import { ListNode } from "../../models/chapter/ListNode";
import { ParagraphNode } from "../../models/chapter/ParagraphNode";
import { QuoteNode } from "../../models/chapter/QuoteNode";
import { RuleNode } from "../../models/chapter/RuleNode";
import { TableNode } from "../../models/chapter/TableNode";
import { TextNode } from "../../models/chapter/TextNode";
import { AtomNode } from "../../models/chapter/AtomNode";
import { BlocksNode } from "../../models/chapter/BlocksNode";
import { ChapterNode } from "../../models/chapter/ChapterNode";
import { RootNode } from "../../models/chapter/RootNode";
import { Edit } from "../../models/chapter/Edit";
import { Node } from "../../models/chapter/Node";

import { CaretState } from "./CaretState";

// From: https://thenounproject.com/browse/collection-icon/minio-text-editor-bold-13520/?p=1
import Clear from "../../assets/svg/clear.svg";
import Bold from "../../assets/svg/bold.svg";
import Italic from "../../assets/svg/italic.svg";
import Link from "../../assets/svg/link.svg";
import Media from "../../assets/svg/media.svg";
import Subscript from "../../assets/svg/sub.svg";
import Superscript from "../../assets/svg/super.svg";
import Comment from "../../assets/svg/comment.svg";
import Indent from "../../assets/svg/indent.svg";
import Unindent from "../../assets/svg/unindent.svg";
import Paragraph from "../../assets/svg/paragraph.svg";
import Bullets from "../../assets/svg/bullets.svg";
import Numbers from "../../assets/svg/numbers.svg";
import Quote from "../../assets/svg/quote.svg";
import Code from "../../assets/svg/code.svg";
import Undo from "../../assets/svg/undo.svg";
import Redo from "../../assets/svg/redo.svg";
import { Command } from "./Command";

function insertTableRowColumn(context: CaretState, table: TableNode, format: FormatNode, row: boolean, before: boolean): Edit {
    const location = table.locate(format);
    if(location === undefined) return;
    return rootWithNode(
        context, 
        table, 
        row ? table.withNewRow(location.row + (before ? 0 : 1)): table.withNewColumn(location.column + (before ? 0 : 1)),
        t => ((t as TableNode).getCell(location.row + (row && !before ? 1 : 0), location.column + (!row && !before ? 1 : 0)) as FormatNode).getFirstCaret()
    )
}

function deleteTableRowColumn(context: CaretState, table: TableNode, format: FormatNode, row: boolean): Edit {
    const location = table.locate(format);
    if(location === undefined) return;
    return rootWithNode(
        context,
        table,
        row ? table.withoutRow(location.row) : table.withoutColumn(location.column),
        t => {
            return (row ?
                (t as TableNode).getCell(location.row === table.getRowCount() ? location.row - 1 : location.row, location.column) :
                (t as TableNode).getCell(location.row, location.column === table.getColumnCount() ? location.column - 1 : location.column))?.getFirstCaret();
        }
    )
}

// A helper function that encapsulates boilerplate for replacing a node in a root and updating a caret.
function rootWithNode<NodeType extends Node>(context: CaretState, original: NodeType | undefined, replacement: NodeType | undefined, caret?: (node: NodeType) => Caret | undefined): Edit | undefined {

    // If there was no original or replacement, do nothing. Saves commands from having to check.
    if(original === undefined || replacement === undefined) return;
    // Make the new root. Bail on fail.
    const newRoot = context.root.withNodeReplaced(original, replacement);
    if(newRoot === undefined) return;
    // Generate a new caret based on the replacement, if there's a generator. Bail on fail.
    const newCaret = caret?.call(undefined, replacement);
    if(caret !== undefined && newCaret === undefined) return;
    // Return the edit
    return { root: newRoot, range: newCaret !== undefined ? { start: newCaret, end: newCaret } : context.range }

}

// An ordered list of command specifications for keyboard and mouse input.
export const commands: Command[] = [
    {
        label: "—↑",
        description: "insert row above",
        category: "table",
        control: false, alt: true, shift: false, key: "ArrowUp",
        visible: context => context.table !== undefined,
        active: context => context.table !== undefined && context.format !== undefined,
        handler: context => context.table !== undefined && context.format !== undefined ? insertTableRowColumn(context, context.table, context.format, true, true) : undefined
    },
    {
        label: "—↓",
        description: "insert row below",
        category: "table",
        control: false, alt: true, shift: false, key: "ArrowDown",
        visible: context => context.table !== undefined,
        active: context => context.table !== undefined && context.format !== undefined,
        handler: context => context.table !== undefined && context.format !== undefined ? insertTableRowColumn(context, context.table, context.format, true, false) : undefined
    },
    {
        label: "→|",
        description: "insert column after",
        category: "table",
        control: false, alt: true, shift: false, key: "ArrowRight",
        visible: context => context.table !== undefined,
        active: context => context.table !== undefined && context.format !== undefined,
        handler: context => context.table !== undefined && context.format !== undefined ? insertTableRowColumn(context, context.table, context.format, false, false) : undefined
    },
    {
        label: "|←",
        description: "insert column before",
        category: "table",
        control: false, alt: true, shift: false, key: "ArrowLeft",
        visible: context => context.table !== undefined,
        active: context => context.table !== undefined && context.format !== undefined,
        handler: context => context.table !== undefined && context.format !== undefined ? insertTableRowColumn(context, context.table, context.format, false, true) : undefined
    },
    {
        label: "\u232B—",
        description: "delete row",
        category: "table",
        control: false, alt: true, shift: false, key: "Backspace",
        visible: context => context.table !== undefined,
        active: context => context.format !== undefined && context.table !== undefined && context.table.getRowCount() > 1,
        handler: context => context.format !== undefined && context.table !== undefined ? deleteTableRowColumn(context, context.table, context.format, true) : undefined
    },
    {
        label: "\u232B|",
        description: "delete column",
        category: "table",
        control: false, alt: true, shift: true, key: "Backspace",
        visible: context => context.table !== undefined,
        active: context => context.format !== undefined && context.table !== undefined && context.table.getColumnCount() > 1,
        handler: context => context.format !== undefined && context.table !== undefined ? deleteTableRowColumn(context, context.table, context.format, false) : undefined
    },
    {
        description: "move to previous character",
        category: "navigation",
        control: false, alt: false, shift: false, key: "ArrowLeft",
        visible: context => false,
        active: context => context.endIsTextOrAtom,
        handler: context => {
            if(context.end.node instanceof TextNode || context.end.node instanceof AtomNode) {
                const nextCaret = context.root.getAdjacentCaret(context.end, false);
                const sortedRange = context.root.sortRange(context.range);
                return { root: context.root, range: nextCaret === undefined ? { start: sortedRange.start, end: sortedRange.start } : { start: nextCaret, end: nextCaret }};
            }
        }
    },
    {
        description: "move to previous word",
        category: "navigation",
        control: false, alt: true, shift: false, key: "ArrowLeft",
        visible: false,
        active: context => context.endIsTextOrAtom,
        handler: context => {
            if(context.end.node instanceof TextNode || context.end.node instanceof AtomNode) {
                const previous = context.end.node.previousWord(context.root, context.end.index);
                return { root: context.root, range: { start: previous, end: previous } };
            }
        }
    },
    {
        description: "move to paragraph start",
        category: "navigation",
        control: true, alt: false, shift: false, key: "ArrowLeft",
        visible: false,
        active: context => context.format !== undefined,
        handler: context => {
            if(context.format !== undefined) {
                const first = context.format.getFirstTextNode();
                return { root: context.root, range: { start: { node: first, index: 0 }, end: { node: first, index: 0 }}}
            }
        }
    },
    {
        description: "expand selection to previous character",
        category: "selection",
        control: false, alt: false, shift: true, key: "ArrowLeft",
        visible: false,
        active: context => context.endIsTextOrAtom,
        handler: context => {
            if(context.end.node instanceof TextNode || context.end.node instanceof AtomNode) {
                const previous = context.root.getAdjacentCaret(context.end, false);
                if(previous === undefined) return;
                return { root: context.root, range: { start: context.start, end: previous } };
            }
        }
    },
    {
        description: "expand selection to previous word",
        category: "selection",
        control: false, alt: true, shift: true, key: "ArrowLeft",
        visible: false,
        active: context => context.endIsTextOrAtom,
        handler: context => {
            if(context.end.node instanceof TextNode || context.end.node instanceof AtomNode) {
                const previous = context.end.node.previousWord(context.root, context.end.index);
                return { root: context.root, range: { start: context.start, end: previous } };
            }
        }
    },
    {
        description: "expand selection to start",
        category: "selection",
        control: true, alt: false, shift: true, key: "ArrowLeft",
        visible: false,
        active: context => context.format !== undefined,
        handler: context => {
            if(context.format !== undefined) {
                const first = context.format.getFirstTextNode();
                return { root: context.root, range: { start: context.start, end: { node: first, index: 0 } } };
            }
        }
    },
    {
        description: "move to next character",
        category: "navigation",
        control: false, alt: false, shift: false, key: "ArrowRight",
        visible: false,
        active: context => context.endIsTextOrAtom,
        handler: context => {
            if(context.end.node instanceof TextNode || context.end.node instanceof AtomNode) {
                const nextCaret = context.root.getAdjacentCaret(context.end, true);
                const sortedRange = context.root.sortRange(context.range);
                // If there is no next caret, move the caret to the largest of the current start and end.
                return { root: context.root, range: nextCaret === undefined ? { start: sortedRange.end, end: sortedRange.end } : { start: nextCaret, end: nextCaret }};
            }
        }
    },
    {
        description: "move to next word",
        category: "navigation",
        control: false, alt: true, shift: false, key: "ArrowRight",
        visible: false,
        active: context => context.endIsTextOrAtom,
        handler: context => {
            if(context.end.node instanceof TextNode || context.end.node instanceof AtomNode) {
                const next = context.end.node.nextWord(context.root, context.end.index);
                return { root: context.root, range: { start: next, end: next } }
            }
        }
    },
    {
        description: "move to paragraph end",
        category: "navigation",
        control: true, alt: false, shift: false, key: "ArrowRight",
        visible: false,
        active: context => context.format !== undefined,
        handler: context => {
            if(context.format !== undefined) {
                const last = context.format.getLastTextNode();
                const caret = { node: last, index: last.getLength() };
                return { root: context.root, range: { start: caret, end: caret} };
            }
        }
    },
    {
        description: "expand selection to next character",
        category: "selection",
        control: false, alt: false, shift: true, key: "ArrowRight",
        visible: false,
        active: context => context.endIsTextOrAtom,
        handler: context => {
            if(context.end.node instanceof TextNode || context.end.node instanceof AtomNode) {
                const next = context.root.getAdjacentCaret(context.end, true);
                if(next === undefined) return;
                return { root: context.root, range: { start: context.start, end: next } };
            }
        }
    },
    {
        description: "expand selection to next word",
        category: "selection",
        control: false, alt: true, shift: true, key: "ArrowRight",
        visible: false,
        active: context => context.endIsTextOrAtom,
        handler: context => {
            if(context.end.node instanceof TextNode || context.end.node instanceof AtomNode) {
                const previous = context.end.node.nextWord(context.root, context.end.index);
                return { root: context.root, range: { start: context.start, end: previous } };
            }
        }
    },
    {
        description: "expand selection to end",
        category: "selection",
        control: true, alt: false, shift: true, key: "ArrowRight",
        visible: false,
        active: context => context.format !== undefined,
        handler: context => {
            if(context.format !== undefined) {
                const last = context.format.getLastTextNode();
                return { root: context.root, range: { start: context.start, end: { node: last, index: last.getLength() } } };
            }
        }
    },
    {
        description: "expand selection to all",
        category: "selection",
        control: true, alt: false, shift: false, key: "a",
        visible: false,
        active: context => true,
        handler: context => {
            // If in a footnote, expand to the footnote.
            if(context.atom) {
                const format = context.atom.getMeta();
                return { root: context.root, range: { start: format.getFirstCaret(), end: format.getLastCaret() } };
            }
            // If not in a paragraph, expand to all of the formats of the block.
            else if(context.paragraph === undefined && context.block) {
                const formats = context.block.getFormats();
                if(formats.length > 0)
                    return { root: context.root, range: { start: formats[0].getFirstCaret(), end: formats[formats.length - 1].getLastCaret() }}
            }
            else {
                // Find the first and last caret of the entire chapter.
                const text = context.root?.getTextNodes();
                if(text && text.length > 0) {
                    return { 
                        root: context.root, 
                        range: {
                            start: { node: text[0], index: 0 },
                            end: { node: text[text.length - 1], index: text[text.length - 1].getLength() }
                        }
                    };
                }
            }
        }
    },
    {
        description: "move up one line",
        category: "navigation",
        control: false, alt: false, shift: false, key: "ArrowUp",
        visible: false,
        active: context => context.startIsTextOrAtom,
        handler: (context, utilities) => {
            const above = utilities.getCaretOnLine(context.start, false);
            return { root: context.root, range: { start: above, end: above } };
        }
    },
    {
        description: "move selection up one line",
        category: "selection",
        control: false, alt: false, shift: true, key: "ArrowUp",
        visible: false,
        active: context => context.startIsTextOrAtom,
        handler: (context, utilities) => {
            const above = utilities.getCaretOnLine(context.end, false);
            return { root: context.root, range: { start: context.start, end: above } };
        }
    },
    {
        description: "move up down line",
        category: "navigation",
        control: false, alt: false, shift: false, key: "ArrowDown",
        visible: false,
        active: context => context.startIsTextOrAtom,
        handler: (context, utilities) => {
            const below = utilities.getCaretOnLine(context.start, true);
            return { root: context.root, range: { start: below, end: below } };
        }
    },
    {
        description: "move selection down one line",
        category: "selection",
        control: false, alt: false, shift: true, key: "ArrowDown",
        visible: false,
        active: context => context.startIsTextOrAtom,
        handler: (context, utilities) => {
            const below = utilities.getCaretOnLine(context.end, true);
            return { root: context.root, range: { start: context.start, end: below } };
        }
    },
    {
        description: "delete previous character",
        category: "text",
        control: false, alt: false, shift: false, key: "Backspace",
        visible: false,
        active: true,
        handler: context => {
            if(context.root === undefined) return;
            if(context.isSelection) {
                const edit = context.root.withRangeFormatted(context.range, undefined);
                if(edit === undefined) return;
                return rootWithNode<RootNode>(context, context.root, edit.root as RootNode, () => edit.range.start)
            }
            else {
                const edit = context.root.withoutAdjacentContent(context.start, false);
                if(edit === undefined) return;
                return rootWithNode<RootNode>(context, context.root, edit.root as RootNode, () => edit.range.start)
            }
        }
    },
    {
        description: "delete next character",
        category: "text",
        control: false, alt: false, shift: false, key: "Delete",
        visible: false,
        active: true,
        handler: context => {
            if(context.root === undefined) return;
            if(context.isSelection) {
                const edit = context.root.withRangeFormatted(context.range, undefined);
                if(edit === undefined) return;
                return rootWithNode<RootNode>(context, context.root, edit.root as RootNode, () => edit.range.start)
            }
            else {
                const edit = context.root.withoutAdjacentContent(context.start, true);
                if(edit === undefined) return;
                return rootWithNode<RootNode>(context, context.root, edit.root as RootNode, () => edit.range.start)
            }
        }
    },
    {
        description: "insert code newline",
        category: "text",
        control: false, alt: false, shift: false, key: "Enter",
        visible: false,
        active: context => context.code !== undefined,
        handler: context => {
            if(context.code?.getCodeNode() !== context.start.node) return;
            const newText = context.start.node.withCharacterAt("\n", context.start.index);
            if(newText === undefined) return;
            return rootWithNode(
                context, 
                context.start.node, 
                newText,
                text => { return { node: text, index: context.start.index + 1 } }
            );
    
        }
    },
    {
        description: "split list item",
        category: "list",
        control: false, alt: false, shift: false, key: "Enter",
        visible: false,
        active: context => context.list !== undefined,
        handler: context => {
            if(context.list === undefined) return;
            const lastItem = context.list.getLastItem();
            const lastCaret = lastItem?.getLastCaret();
            // If we're at the last item in the list and it's empty, then add a
            if(lastItem !== undefined && lastCaret !== undefined && lastCaret.node instanceof TextNode && lastCaret.node.getLength() === 0 && lastCaret.node === context.end.node && lastCaret.index === context.end.index) {
                const listParent = context.list.getParent(context.root);
                if(listParent instanceof ListNode) {
                    const newSublist = context.list.withoutItem(lastItem);
                    if(newSublist === undefined) return;
                    const newListWithoutSublistItem = listParent.withChildReplaced(context.list, newSublist);
                    if(newListWithoutSublistItem === undefined) return;
                    const newListWithSublistItem = newListWithoutSublistItem.withItemAfter(lastItem, newSublist);
                    if(newListWithSublistItem === undefined) return;                    
                    return rootWithNode(context, listParent, newListWithSublistItem, n => lastCaret)
                }
                else if(listParent instanceof BlocksNode) {
                    const listWithoutItem = context.list.withoutItem(lastItem);
                    if(listWithoutItem === undefined) return;
                    const newBlocks = listParent.withChildReplaced(context.list, listWithoutItem)?.withBlockInsertedAfter(listWithoutItem, new ParagraphNode(0, lastItem));
                    if(newBlocks === undefined) return;
                    return rootWithNode(context, listParent, newBlocks, n => lastCaret );
                }
            }
            else
                return rootWithNode(context, context.list, context.list?.withItemSplit(context.range.start), newList => {
                    const index = context.list?.getItemContaining(context.range.start);
                    if(index === undefined) return;
                    const item = (newList as ListNode).getItem(index + 1);
                    if(item === undefined) return;
                    return item.getFirstCaret();
                })
        }
    },
    {
        description: "split paragraph",
        category: "paragraph",
        control: false, alt: false, shift: false, key: "Enter",
        visible: false,
        active: context => context.atom === undefined && context.blocks !== undefined,
        handler: context => {
            const edit = context.blocks?.withSelectionSplit(context.range);
            if(edit === undefined) return;
            return rootWithNode(context, context.blocks, edit.root, () => edit.range.start)
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
        handler: context => rootWithNode(context, context.blocks, context.blocks?.withListsIndented(context.range, true))
    },        
    {
        label: "unindent",
        icon: Unindent,
        description: "unindent list item",
        category: "list",
        control: false, alt: false, shift: true, key: "Tab",
        visible: context => context.list !== undefined,
        active: context => context.list !== undefined && context.list.isInside(context.root, ListNode),
        handler: context => rootWithNode(context, context.blocks, context.blocks?.withListsIndented(context.range, false))
    },
    {
        label: "plain",
        icon: Clear,
        description: "clear formatting",
        category: "text",
        control: true, alt: false, shift: false, key: "0",
        visible: true,
        active: context => context.startIsText || context.endIsText,
        handler: context => context.root.withRangeFormatted(context.range, "")
    },
    {
        label: "bold",
        icon: Bold,
        description: "bold",
        category: "text",
        control: true, alt: false, shift: false, key: "b",
        visible: true,
        active: context => context.startIsText || context.endIsText,
        handler: context => context.root.withRangeFormatted(context.range, "*")
    },
    {
        description: "italic",
        icon: Italic,
        category: "text",
        control: true, alt: false, shift: false, key: "i",
        visible: true,
        active: context => context.startIsText || context.endIsText,
        handler: context => context.root.withRangeFormatted(context.range, "_")
    },
    {
        label: "sub\u2099",
        icon: Subscript,
        description: "subscript",
        category: "text",
        control: true, alt: false, shift: false, key: ",",
        visible: true,
        active: context => context.startIsText || context.endIsText,
        handler: context => context.root.withRangeFormatted(context.range, "v")
    },
    {
        label: "super\u207F",
        icon: Superscript,
        description: "superscript",
        category: "text",
        control: true, alt: false, shift: false, key: ".",
        visible: true,
        active: context => context.startIsText || context.endIsText,
        handler: context => context.root.withRangeFormatted(context.range, "^")
    },
    {
        label: "<code>",
        icon: Code,
        description: "toggle code",
        category: "annotation",
        control: true, alt: false, shift: false, key: "j",
        visible: true,
        active: context => context.startIsText || context.endIsText,
        handler: context => context.meta instanceof InlineCodeNode ?
            rootWithNode(context, context.format, context.format?.withSegmentReplaced(context.meta, context.meta.getText())) : 
            context.root.withSegmentAtSelection(context.range, text => new InlineCodeNode(new TextNode(text)))
    },
    {
        label: "link ⚭",
        icon: Link,
        description: "toggle link",
        category: "annotation",
        control: true, alt: false, shift: false, key: "k",
        visible: true,
        active: context => (context.atom === undefined && context.meta === undefined) || context.meta instanceof LinkNode,
        handler: context => context.meta instanceof LinkNode ? 
            rootWithNode(context, context.format, context.format?.withSegmentReplaced(context.meta, context.meta.getText())) : 
            context.root.withSegmentAtSelection(context.range, text => new LinkNode(new TextNode(text)))
    },
    {
        label: "Aa",
        description: "toggle definition",
        category: "annotation",
        control: true, alt: false, shift: false, key: "d",
        visible: context => context.chapter && context.atom === undefined && context.meta === undefined,
        active: context => context.chapter && context.atom === undefined && context.meta === undefined,
        handler: context => context.meta instanceof DefinitionNode ? 
            rootWithNode(context, context.format, context.format?.withSegmentReplaced(context.meta, context.meta.getText())) : 
            context.root.withSegmentAtSelection(context.range, text => new DefinitionNode(new TextNode(text)))
    },
    {
        label: "a\u1D43",
        description: "insert footnote",
        category: "annotation",
        control: true, alt: false, shift: false, key: "f",
        visible: context => context.chapter && context.atom === undefined && context.meta === undefined,
        active: context => context.chapter && context.atom === undefined && context.meta === undefined,
        handler: context => context.root.withSegmentAtSelection(context.range, text => new FootnoteNode(new FormatNode("", [ new TextNode(text) ])))
    },
    {
        label: "a\u00b9",
        description: "insert citations",
        category: "annotation",
        control: true, alt: false, shift: false, key: "t",
        visible: context => context.chapter && context.atom === undefined && context.meta === undefined,
        active: context => context.chapter && context.atom === undefined && context.meta === undefined,
        handler: context => context.root.withSegmentAtSelection(context.range, text => new CitationsNode([]))
    },
    {
        label: "•",
        description: "insert label",
        category: "annotation",
        control: true, alt: false, shift: false, key: "l",
        visible: context => context.chapter && context.atom === undefined && context.meta === undefined,
        active: context => context.chapter && context.atom === undefined && context.meta === undefined,
        handler: context => context.root.withSegmentAtSelection(context.range, text => new LabelNode(""))
    },
    {
        label: "comment",
        icon: Comment,
        description: "insert comment",
        category: "annotation",
        control: true, alt: false, shift: false, key: "'",
        visible: context => context.chapter && context.atom === undefined && context.meta === undefined,
        active: context => context.chapter && context.atom === undefined && context.meta === undefined,
        handler: context => context.root.withSegmentAtSelection(context.range, text => new CommentNode(new FormatNode("", [ new TextNode(text) ])))
    },
    {
        label: "paragraph",
        icon: Paragraph,
        description: "format as paragraph",
        category: "level",
        control: true, alt: true, shift: false, code: "Digit0",
        visible: context => context.paragraph !== undefined && context.paragraph.getLevel() !== 0,
        active: context => context.paragraph !== undefined && context.paragraph.getLevel() !== 0,
        handler: context => {
            if(context.paragraph === undefined) return;
            return rootWithNode(context, context.paragraph, context.paragraph.withLevel(0));
        }
    },
    {
        label: "h1",
        description: "format as 1st level header",
        category: "level",
        control: true, alt: true, shift: false, code: "Digit1",
        visible: context => context.paragraph !== undefined,
        active: context => context.paragraph !== undefined && context.paragraph.getLevel() !== 1,
        handler: context => rootWithNode(context, context.paragraph, context.paragraph?.withLevel(1))
    },
    {
        label: "h2",
        description: "format as 2nd level header",
        category: "level",
        control: true, alt: true, shift: false, code: "Digit2",
        visible: context => context.paragraph !== undefined,
        active: context => context.paragraph !== undefined && context.paragraph.getLevel() !== 2,
        handler: context => rootWithNode(context, context.paragraph, context.paragraph?.withLevel(2))
    },
    {
        label: "h3",
        description: "format as 3rd level header",
        category: "level",
        control: true, alt: true, shift: false, code: "Digit3",
        visible: context => context.paragraph !== undefined,
        active: context => context.paragraph !== undefined && context.paragraph.getLevel() !== 3,
        handler: context => rootWithNode(context, context.paragraph, context.paragraph?.withLevel(3))
    },
    {
        label: "\u2014",
        description: "insert horizontal rule",
        category: "block",
        control: true, alt: false, shift: true, key: "h",
        visible: context => context.paragraph !== undefined,
        active: context => context.paragraph !== undefined && context.atParagraphStart,
        handler: context => context.paragraph ? rootWithNode(context, context.blocks, context.blocks?.withBlockInsertedBefore(context.paragraph, new RuleNode())) : undefined
    },
    {
        label: "🄰",
        description: "insert callout",
        category: "block",
        control: true, alt: false, shift: true, key: "e",
        visible: context => context.paragraph !== undefined,
        active: context => context.paragraph !== undefined && context.atParagraphStart,
        handler: context => {
            // If the caret is in a paragraph in a blocks node, insert a callout before the current paragraph.
            if(context.blocks && context.paragraph) {
                // Make a new callout node with an empty paragraph, insert it before the paragraph the caret is in, and place the caret inside the empty paragraph.
                const newParagraph = new ParagraphNode();
                return rootWithNode(
                    context, 
                    context.blocks, 
                    context.blocks.withBlockInsertedBefore(context.paragraph, new CalloutNode([ newParagraph ])), 
                    callout => newParagraph.getFirstCaret()
                );
            }
        } 
    },
    {
        label: "‟",
        icon: Quote,
        description: "insert quote",
        category: "block",
        control: true, alt: false, shift: true, key: "u",
        visible: context => context.paragraph !== undefined,
        active: context => context.paragraph !== undefined && context.atParagraphStart,
        handler: context => {
            if(context.blocks && context.paragraph) {
                // Make a new quote and place the caret inside the quote's first empty paragraph.
                const newParagraph = new ParagraphNode();
                return rootWithNode(
                    context, 
                    context.blocks, 
                    context.blocks.withBlockInsertedBefore(context.paragraph, new QuoteNode([ newParagraph ])),
                    quote => newParagraph.getFirstCaret()
                );
            }
        } 
    },
    {
        label: "<code>",
        icon: Code,
        description: "insert code",
        category: "block",
        control: true, alt: false, shift: true, key: "s",
        visible: context => context.paragraph !== undefined,
        active: context => context.paragraph !== undefined && context.atParagraphStart,
        handler: context => {
            if(context.blocks && context.paragraph) {
                const newCode = new CodeNode(new TextNode(), "plaintext", "|");
                return rootWithNode(
                    context, 
                    context.blocks, 
                    context.blocks.withBlockInsertedBefore(context.paragraph, newCode), 
                    code => { return { node: newCode.getCodeNode(), index: 0 } }
                );
            }
        } 
    },
    {
        label: "image/video",
        icon: Media,
        description: "insert image or video",
        category: "block",
        control: true, alt: false, shift: true, key: "p",
        visible: context => context.paragraph !== undefined,
        active: context => context.paragraph !== undefined && context.atParagraphStart,
        handler: context => {
            if(context.blocks && context.paragraph) {
                // Place the caret inside the code's code node.
                const newEmbed = new EmbedNode("", "");
                return rootWithNode(
                    context, 
                    context.blocks, 
                    context.blocks.withBlockInsertedBefore(context.paragraph, newEmbed), 
                    embed => newEmbed.getCaption().getFirstCaret()
                );
            }
        } 
    },
    {
        label: "▦",
        description: "insert table",
        category: "block",
        control: true, alt: false, shift: true, key: "\\",
        visible: context => context.paragraph !== undefined,
        active: context => context.paragraph !== undefined && context.atParagraphStart,
        handler: context => {
            if(context.blocks && context.paragraph) {
                // Create a 3x3 of table rows and columns
                // Return a caret corresponding to the first cell.
                const newRows: FormatNode[][] = [[], [], []];
                for(let r = 0; r < Math.max(1, 3); r++) {
                    for(let c = 0; c < Math.max(1, 3); c++)
                        newRows[r].push(new FormatNode("", [ new TextNode()]));
                }
                const newTable = new TableNode(newRows, "|", new FormatNode("", [ new TextNode()]));
                return rootWithNode(
                    context, 
                    context.blocks, 
                    context.blocks.withBlockInsertedBefore(context.paragraph, newTable), 
                    table => { return { node: newTable.getRows()[0][0].getTextNodes()[0], index: 0 } }
                );
            }
        } 
    },
    {
        label: "bulleted",
        icon: Bullets,
        description: "convert paragraph to bulleted list item",
        category: "list",
        control: true, alt: false, shift: true, key: "7",
        visible: context => context.paragraph !== undefined && context.list === undefined,
        active: context => context.paragraph !== undefined && context.list === undefined,
        handler: context => rootWithNode(context, context.blocks, context.blocks?.withParagraphsAsLists(context.range, false))
    },
    {
        label: "numbered",
        icon: Numbers,
        description: "convert paragraph to numbered list item",
        category: "list",
        control: true, alt: false, shift: true, key: "8",
        visible: context => context.paragraph !== undefined && context.list === undefined,
        active: context => context.paragraph !== undefined && context.list === undefined,
        handler: context => rootWithNode(context, context.blocks, context.blocks?.withParagraphsAsLists(context.range, true))
    },
    {
        label: "bulleted",
        icon: Bullets,
        description: "convert numbered list item to bulleted",
        category: "list",
        control: true, alt: false, shift: true, key: "7",
        visible: context => context.list !== undefined && context.list.isNumbered(),
        active: context => context.list !== undefined && context.list.isNumbered(),
        handler: context => context.list ? rootWithNode(context, context.blocks, context.blocks?.withListAsStyle(context.list, false)) : undefined
    },
    {
        label: "numbered",
        icon: Numbers,
        description: "convert bulleted list item to numbered",
        category: "list",
        control: true, alt: false, shift: true, key: "8",
        visible: context => context.list !== undefined && !context.list.isNumbered(),
        active: context => context.list !== undefined && !context.list.isNumbered(),
        handler: context => context.list ? rootWithNode(context, context.blocks, context.blocks?.withListAsStyle(context.list, true)) : undefined
    },
    {
        label: "paragraph",
        icon: Paragraph,
        description: "convert bulleted list item to paragraph",
        category: "list",
        control: true, alt: false, shift: true, key: ["7", "8"],
        visible: context => context.list !== undefined,
        active: context => context.list !== undefined,
        handler: context => rootWithNode(context, context.blocks, context.blocks?.withListsAsParagraphs(context.range))
    },
    {
        label: "undo",
        icon: Undo,
        description: "undo the last command",
        category: "history",
        control: true, alt: false, shift: false, key: ["z"],
        visible: true,
        active: context => context.undoStack.length > 0 && context.undoPosition < context.undoStack.length - 1,
        handler: context => context.undo()
    },
    {
        label: "redo",
        icon: Redo,
        description: "redo the most recently undone command",
        category: "history",
        control: true, alt: false, shift: true, key: ["z"],
        visible: true,
        active: context => context.undoPosition > 0,
        handler: context => context.redo()
    },
    {
        label: "✂",
        description: "delete the selected content and copy it to the clipboard",
        category: "clipboard",
        control: true, alt: false, shift: false, key: ["x"],
        visible: true,
        active: context => context.root !== undefined && context.isSelection,
        handler: context => { 
            if(context.root === undefined) return;
            // Save the copied content to the clipboard
            const copy = context.root.copyRange(context.range);
            const edit = context.root.withRangeFormatted(context.range, undefined);
            if(edit === undefined || copy === undefined) return;
            context.handleCopy(copy);

            return rootWithNode<RootNode>(context, context.root, edit.root as RootNode, () => edit.range.start);
        }
    },
    {
        label: "🗎",
        description: "copy the selected content to the clipboard",
        category: "clipboard",
        control: true, alt: false, shift: false, key: ["c"],
        visible: true,
        active: context => context.isSelection,
        handler: context => { 
            if(context.root === undefined) return;        
            // Save the copied content to the clipboard
            const copy = context.root.copyRange(context.range);
            if(copy !== undefined)
                context.handleCopy(copy);
            return undefined;
        
        }
    },
    {
        label: "⎘",
        description: "paste the content from the clipboard",
        category: "clipboard",
        control: true, alt: false, shift: false, key: ["v"],
        visible: true,
        active: context => true,
        handler: context => {
            if(context.root === undefined) return undefined;

            // See if there's something on the clipboard.
            if(navigator.clipboard) {
                navigator.clipboard.read()
                    .then((items: ClipboardItems) => {
                        // If there's nothing, paste whatever is on the editor clipboard, if there is something.
                        if(items.length === 0 && context.clipboard !== undefined)
                            context.handlePaste(context, context.clipboard, true);
                        else {
                            for(const item of items) {
                                for(const type of item.types) {
                                    if(type === "text/plain")
                                        item.getType(type)
                                            .then((blob: Blob) => {
                                                blob.text().then(text => {
                                                    context.handlePaste(context, new TextNode(text), true);
                                                })
                                            })
                                }
                            }  
                        }
                    })
            }
            // If there is no OS clipboard access, but there is something in the editor clipboard, copy it.
            else if(context.clipboard !== undefined) {
                return context.handlePaste(context, context.clipboard, false);
            }

            return undefined;
        }
    },
    {
        label: "insert",
        description: "insert character",
        category: "text",
        control: false, alt: false, shift: undefined, key: undefined,
        visible: false,
        active: (context, key) => key !== undefined && key.length === 1,
        handler: (context, utilities, key) => {
            const range = context.range;
            if(key.length === 1) {
                // Insert at the start.
                let sortedRange = range.start.node.sortRange(range);
                let insertionPoint = sortedRange.start;
                let newRoot: RootNode | undefined = context.root;

                // Not a text node? Fail.
                if(!(insertionPoint.node instanceof TextNode)) return;

                // If there's a selection, remove it before inserting, and insert at the caret returned.
                if(context.isSelection) {
                    if(context.code) {
                        if(context.code.getCodeNode() === sortedRange.start.node) {
                            const newText = insertionPoint.node.withoutRange(sortedRange);
                            if(newText === undefined) return;
                            const edit = newRoot.withNodeReplaced(insertionPoint.node, newText);
                            if(edit === undefined) return;
                            newRoot = edit;
                            insertionPoint = { node: newText, index: sortedRange.start.index };
                        }
                    }
                    else {
                        // Try to remove the range.
                        let edit = newRoot.withRangeFormatted(sortedRange, undefined);
                        // If we fail, fail to insert at the selection.
                        if(edit === undefined) return;
                        newRoot = edit.root as RootNode;
                        insertionPoint = edit.range.start;
                    }
                }

                // Not a text node? Fail.
                if(!(insertionPoint.node instanceof TextNode)) return;

                // Update the text node.
                const newText = insertionPoint.node.withCharacterAt(key, insertionPoint.index);
                if(newText === undefined) return;

                // Replace the text.
                newRoot = newRoot.withNodeReplaced(insertionPoint.node, newText);
                if(newRoot === undefined) return;

                // Update the chapter
                return rootWithNode(context, context.root, newRoot, () => { return { node: newText, index: insertionPoint.index + 1 }});
    
            }
        }
    }
];