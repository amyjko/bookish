import CalloutNode from "$lib/models/chapter/CalloutNode";
import type Caret from "$lib/models/chapter/Caret";
import CitationsNode from "$lib/models/chapter/CitationsNode";
import CodeNode from "$lib/models/chapter/CodeNode";
import CommentNode from "$lib/models/chapter/CommentNode";
import DefinitionNode from "$lib/models/chapter/DefinitionNode";
import EmbedNode from "$lib/models/chapter/EmbedNode";
import FootnoteNode from "$lib/models/chapter/FootnoteNode";
import FormatNode from "$lib/models/chapter/FormatNode";
import InlineCodeNode from "$lib/models/chapter/InlineCodeNode";
import LabelNode from "$lib/models/chapter/LabelNode";
import LinkNode from "$lib/models/chapter/LinkNode";
import ListNode from "$lib/models/chapter/ListNode";
import ParagraphNode from "$lib/models/chapter/ParagraphNode";
import QuoteNode from "$lib/models/chapter/QuoteNode";
import RuleNode from "$lib/models/chapter/RuleNode";
import TableNode from "$lib/models/chapter/TableNode";
import TextNode from "$lib/models/chapter/TextNode";
import AtomNode from "$lib/models/chapter/AtomNode";
import BlocksNode from "$lib/models/chapter/BlocksNode";

import type RootNode from "$lib/models/chapter/RootNode";
import type Edit from "$lib/models/chapter/Edit";
import type Node from "$lib/models/chapter/Node";
import type CaretState from "./CaretState";
import type Command from "./Command";

import BoldIcon from "./icons/bold.svg?raw";
import BulletsIcon from "./icons/bullets.svg?raw";
import CalloutIcon from "./icons/callout.svg?raw";
import CitationIcon from "./icons/citation.svg?raw";
import ClearIcon from "./icons/clear.svg?raw";
import CodeIcon from "./icons/code.svg?raw";
import ColumnAfterIcon from "./icons/columnafter.svg?raw";
import ColumnBeforeIcon from "./icons/columnbefore.svg?raw";
import CommentIcon from "./icons/comment.svg?raw";
import CopyIcon from "./icons/copy.svg?raw";
import CutIcon from "./icons/cut.svg?raw";
import DefineIcon from "./icons/define.svg?raw";
import DeleteColumnIcon from "./icons/deletecolumn.svg?raw";
import DeleteRowIcon from "./icons/deleterow.svg?raw";
import FootnoteIcon from "./icons/footnote.svg?raw";
import Header1Icon from "./icons/header1.svg?raw";
import Header2Icon from "./icons/header2.svg?raw";
import Header3Icon from "./icons/header3.svg?raw";
import IndentIcon from "./icons/indent.svg?raw";
import ItalicIcon from "./icons/italic.svg?raw";
import LabelIcon from "./icons/label.svg?raw";
import LinkIcon from "./icons/link.svg?raw";
import MediaIcon from "./icons/media.svg?raw";
import NumbersIcon from "./icons/numbers.svg?raw";
import ParagraphIcon from "./icons/paragraph.svg?raw";
import PasteIcon from "./icons/paste.svg?raw";
import QuoteIcon from "./icons/quote.svg?raw";
import RedoIcon from "./icons/redo.svg?raw";
import RowAboveIcon from "./icons/rowabove.svg?raw";
import RowBelowIcon from "./icons/rowbelow.svg?raw";
import RuleIcon from "./icons/rule.svg?raw";
import SubscriptIcon from "./icons/sub.svg?raw";
import SuperscriptIcon from "./icons/super.svg?raw";
import TableIcon from "./icons/table.svg?raw";
import UndoIcon from "./icons/undo.svg?raw";
import UnindentIcon from "./icons/unindent.svg?raw";
/**
 * Icons:
 *      From: https://www.streamlinehq.com/icons/streamline-mini-line
 *      All use CSS currentColor
 *      No background
 *      SVG
 *      48 px
 *      stroke width 1
 *  */ 

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
const commands: Command[] = [
    {
        icon: RowAboveIcon,
        description: "insert row above",
        category: "table",
        mutates: true,
        control: false, alt: true, shift: false, key: "ArrowUp",
        visible: context => context.table !== undefined,
        active: context => context.table !== undefined && context.format !== undefined,
        handler: context => context.table !== undefined && context.format !== undefined ? insertTableRowColumn(context, context.table, context.format, true, true) : undefined
    },
    {
        icon: RowBelowIcon,
        description: "insert row below",
        category: "table",
        mutates: true,
        control: false, alt: true, shift: false, key: "ArrowDown",
        visible: context => context.table !== undefined,
        active: context => context.table !== undefined && context.format !== undefined,
        handler: context => context.table !== undefined && context.format !== undefined ? insertTableRowColumn(context, context.table, context.format, true, false) : undefined
    },
    {
        icon: ColumnAfterIcon,
        description: "insert column after",
        category: "table",
        mutates: true,
        control: false, alt: true, shift: false, key: "ArrowRight",
        visible: context => context.table !== undefined,
        active: context => context.table !== undefined && context.format !== undefined,
        handler: context => context.table !== undefined && context.format !== undefined ? insertTableRowColumn(context, context.table, context.format, false, false) : undefined
    },
    {
        icon: ColumnBeforeIcon,
        description: "insert column before",
        category: "table",
        mutates: true,
        control: false, alt: true, shift: false, key: "ArrowLeft",
        visible: context => context.table !== undefined,
        active: context => context.table !== undefined && context.format !== undefined,
        handler: context => context.table !== undefined && context.format !== undefined ? insertTableRowColumn(context, context.table, context.format, false, true) : undefined
    },
    {
        icon: DeleteRowIcon,
        description: "delete row",
        category: "table",
        mutates: true,
        control: false, alt: true, shift: false, key: "Backspace",
        visible: context => context.table !== undefined,
        active: context => context.format !== undefined && context.table !== undefined && context.table.getRowCount() > 1,
        handler: context => context.format !== undefined && context.table !== undefined ? deleteTableRowColumn(context, context.table, context.format, true) : undefined
    },
    {
        icon: DeleteColumnIcon,
        description: "delete column",
        category: "table",
        mutates: true,
        control: false, alt: true, shift: true, key: "Backspace",
        visible: context => context.table !== undefined,
        active: context => context.format !== undefined && context.table !== undefined && context.table.getColumnCount() > 1,
        handler: context => context.format !== undefined && context.table !== undefined ? deleteTableRowColumn(context, context.table, context.format, false) : undefined
    },
    {
        icon: "➡️",
        description: "next paragraph",
        category: "navigation",
        mutates: false,
        control: false, alt: false, shift: false, key: "Tab",
        visible: () => false,
        active: context => context.format !== undefined,
        handler: context => {
            if(context.format) {
                let caret = context.root.getNodeAfter<FormatNode>(context.format, (node): node is FormatNode => node instanceof FormatNode)?.getFirstCaret();
                if(caret)
                    return { root: context.root, range: { start: caret, end: caret }}
            }
        }
    },
    {
        icon: "←",
        description: "previous paragraph",
        category: "navigation",
        mutates: false,
        control: false, alt: false, shift: true, key: "Tab",
        visible: () => false,
        active: context => context.format !== undefined,
        // If we're in a table, find the previous cell.
        handler: context => {
            if(context.format) {
                let caret = context.root.getNodeBefore<FormatNode>(context.format, (node): node is FormatNode => node instanceof FormatNode)?.getFirstCaret();
                if(caret)
                    return { root: context.root, range: { start: caret, end: caret }}
            }
        }
    },
    {
        icon: "←",
        description: "move to previous character",
        category: "navigation",
        mutates: false,
        control: false, alt: false, shift: false, key: "ArrowLeft",
        visible: () => false,
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
        icon: "← word",
        description: "move to previous word",
        category: "navigation",
        mutates: false,
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
        icon: "← paragraph",
        description: "move to paragraph start",
        category: "navigation",
        mutates: false,
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
        icon: "← select",
        description: "expand selection to previous character",
        category: "selection",
        mutates: false,
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
        icon: "select ← word",
        description: "expand selection to previous word",
        category: "selection",
        mutates: false,
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
        icon: "select start",
        description: "expand selection to start",
        category: "selection",
        mutates: false,
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
        icon: "→",
        description: "move to next character",
        category: "navigation",
        mutates: false,
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
        icon: "→ word",
        description: "move to next word",
        category: "navigation",
        mutates: false,
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
        icon: "→ end",
        description: "move to paragraph end",
        category: "navigation",
        mutates: false,
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
        icon: "select →",
        description: "expand selection to next character",
        category: "selection",
        mutates: false,
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
        icon: "select → word",
        description: "expand selection to next word",
        category: "selection",
        mutates: false,
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
        icon: "select → end",
        description: "expand selection to end",
        category: "selection",
        mutates: false,
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
        icon: "select all",
        description: "expand selection to all",
        category: "selection",
        mutates: false,
        control: true, alt: false, shift: false, key: "a",
        visible: false,
        active: () => true,
        handler: context => {
            // If in a footnote, expand to the footnote.
            if(context.atom) {
                const format = context.atom.getMeta();
                return { root: context.root, range: { start: format.getFirstCaret(), end: format.getLastCaret() } };
            }
            // If in a code node, expand to the code.
            else if(context.block instanceof CodeNode && context.range.start.node === context.block.getCodeNode()) {
                const code = context.block.getCodeNode();
                return { root: context.root, range: { start: { node: code, index: 0}, end: { node: code, index: code.getLength()}}};
            }
            // If in a non paragraph block, expand to the format of whatever format we're in.
            else if(context.paragraph === undefined && context.block && context.format) {
                return { root: context.root, range: { start: context.format.getFirstCaret(), end: context.format.getLastCaret() }}
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
        icon: "↑ line",
        description: "move up one line",
        category: "navigation",
        mutates: false,
        control: false, alt: false, shift: false, key: "ArrowUp",
        visible: false,
        active: context => context.startIsTextOrAtom,
        handler: (context, utilities) => {
            const above = utilities.getCaretOnLine(context.start, false);
            return { root: context.root, range: { start: above, end: above } };
        }
    },
    {
        icon: "select ↑ line",
        description: "move selection up one line",
        category: "selection",
        mutates: false,
        control: false, alt: false, shift: true, key: "ArrowUp",
        visible: false,
        active: context => context.startIsTextOrAtom,
        handler: (context, utilities) => {
            const above = utilities.getCaretOnLine(context.end, false);
            return { root: context.root, range: { start: context.start, end: above } };
        }
    },
    {
        icon: "select ↓ line",
        description: "move up down line",
        category: "navigation",
        mutates: false,
        control: false, alt: false, shift: false, key: "ArrowDown",
        visible: false,
        active: context => context.startIsTextOrAtom,
        handler: (context, utilities) => {
            const below = utilities.getCaretOnLine(context.start, true);
            return { root: context.root, range: { start: below, end: below } };
        }
    },
    {
        icon: "select ↓ line",
        description: "move selection down one line",
        category: "selection",
        mutates: false,
        control: false, alt: false, shift: true, key: "ArrowDown",
        visible: false,
        active: context => context.startIsTextOrAtom,
        handler: (context, utilities) => {
            const below = utilities.getCaretOnLine(context.end, true);
            return { root: context.root, range: { start: context.start, end: below } };
        }
    },
    {
        icon: "delete ←",
        description: "delete previous character",
        category: "text",
        mutates: false,
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
        icon: "delete →",
        description: "delete next character",
        category: "text",
        mutates: true,
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
        icon: "new line",
        description: "insert code newline",
        category: "text",
        mutates: true,
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
        icon: "split list",
        description: "split list item",
        category: "list",
        mutates: true,
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
                    return rootWithNode(context, listParent, newListWithSublistItem, () => lastCaret)
                }
                else if(listParent instanceof BlocksNode) {
                    const listWithoutItem = context.list.withoutItem(lastItem);
                    if(listWithoutItem === undefined) return;
                    const newBlocks = listParent.withChildReplaced(context.list, listWithoutItem)?.withBlockInsertedAfter(listWithoutItem, new ParagraphNode(0, lastItem));
                    if(newBlocks === undefined) return;
                    return rootWithNode(context, listParent, newBlocks, () => lastCaret );
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
        icon: "split paragraph",
        description: "split paragraph",
        category: "text",
        mutates: true,
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
        icon: IndentIcon,
        description: "indent list item",
        category: "list",
        mutates: true,
        control: false, alt: false, shift: false, key: "Tab",
        visible: context => context.list !== undefined,
        active: context => context.list !== undefined,
        handler: context => rootWithNode(context, context.blocks, context.blocks?.withListsIndented(context.range, true))
    },        
    {
        icon: UnindentIcon,
        description: "unindent list item",
        mutates: true,
        category: "list",
        control: false, alt: false, shift: true, key: "Tab",
        visible: context => context.list !== undefined,
        active: context => context.list !== undefined && context.list.isInside(context.root, ListNode),
        handler: context => rootWithNode(context, context.blocks, context.blocks?.withListsIndented(context.range, false))
    },
    {
        icon: ClearIcon,
        description: "clear formatting",
        mutates: true,
        category: "text",
        control: true, alt: false, shift: false, key: "0",
        visible: true,
        active: context => context.startIsText || context.endIsText,
        handler: context => context.root.withRangeFormatted(context.range, "")
    },
    {
        icon: BoldIcon,
        description: "bold",
        category: "text",
        mutates: true,
        control: true, alt: false, shift: false, key: "b",
        visible: true,
        active: context => context.startIsText || context.endIsText,
        handler: context => context.root.withRangeFormatted(context.range, "*")
    },
    {
        description: "italic",
        icon: ItalicIcon,
        category: "text",
        mutates: true,
        control: true, alt: false, shift: false, key: "i",
        visible: true,
        active: context => context.startIsText || context.endIsText,
        handler: context => context.root.withRangeFormatted(context.range, "_")
    },
    {
        icon: SubscriptIcon,
        description: "subscript",
        category: "text",
        mutates: true,
        control: true, alt: false, shift: false, key: ",",
        visible: true,
        active: context => context.startIsText || context.endIsText,
        handler: context => context.root.withRangeFormatted(context.range, "v")
    },
    {
        icon: SuperscriptIcon,
        description: "superscript",
        category: "text",
        mutates: true,
        control: true, alt: false, shift: false, key: ".",
        visible: true,
        active: context => context.startIsText || context.endIsText,
        handler: context => context.root.withRangeFormatted(context.range, "^")
    },
    {
        icon: CodeIcon,
        description: "toggle code",
        category: "annotation",
        mutates: true,
        control: true, alt: false, shift: false, key: "e",
        visible: true,
        active: context => context.startIsText || context.endIsText,
        handler: context => context.meta instanceof InlineCodeNode ?
            rootWithNode(context, context.format, context.format?.withSegmentReplaced(context.meta, context.meta.getText())) : 
            context.root.withSegmentAtSelection(context.range, text => new InlineCodeNode(new TextNode(text)))
    },
    {
        icon: LinkIcon,
        description: "toggle link",
        category: "annotation",
        mutates: true,
        control: true, alt: false, shift: false, key: "k",
        visible: true,
        active: context => (context.atom === undefined && context.meta === undefined) || context.meta instanceof LinkNode,
        handler: context => context.meta instanceof LinkNode ? 
            rootWithNode(context, context.format, context.format?.withSegmentReplaced(context.meta, context.meta.getText())) : 
            context.root.withSegmentAtSelection(context.range, text => new LinkNode(new TextNode(text)))
    },
    {
        icon: DefineIcon,
        description: "toggle definition",
        category: "annotation",
        mutates: true,
        control: true, alt: false, shift: false, key: "d",
        visible: context => context.chapter && context.atom === undefined && context.meta === undefined,
        active: context => context.chapter && context.atom === undefined && context.meta === undefined,
        handler: context => context.meta instanceof DefinitionNode ? 
            rootWithNode(context, context.format, context.format?.withSegmentReplaced(context.meta, context.meta.getText())) : 
            context.root.withSegmentAtSelection(context.range, text => new DefinitionNode(new TextNode(text)))
    },
    {
        icon: FootnoteIcon,
        description: "insert footnote",
        category: "annotation",
        mutates: true,
        control: true, alt: false, shift: false, key: "f",
        visible: context => context.chapter && context.atom === undefined && context.meta === undefined,
        active: context => context.chapter && context.atom === undefined && context.meta === undefined,
        handler: context => context.root.withSegmentAtSelection(context.range, text => new FootnoteNode(new FormatNode("", [ new TextNode(text) ])))
    },
    {
        icon: CitationIcon,
        description: "insert citations",
        category: "annotation",
        mutates: true,
        control: true, alt: false, shift: false, key: "o",
        visible: context => context.chapter && context.atom === undefined && context.meta === undefined,
        active: context => context.chapter && context.atom === undefined && context.meta === undefined,
        handler: context => context.root.withSegmentAtSelection(context.range, () => new CitationsNode([]))
    },
    {
        icon: LabelIcon,
        description: "insert label",
        category: "annotation",
        mutates: true,
        control: true, alt: false, shift: false, key: "l",
        visible: context => context.chapter && context.atom === undefined && context.meta === undefined,
        active: context => context.chapter && context.atom === undefined && context.meta === undefined,
        handler: context => context.root.withSegmentAtSelection(context.range, () => new LabelNode(""))
    },
    {
        icon: CommentIcon,
        description: "insert comment",
        category: "annotation",
        mutates: true,
        control: true, alt: false, shift: false, key: "'",
        visible: context => context.chapter && context.atom === undefined && context.meta === undefined,
        active: context => context.chapter && context.atom === undefined && context.meta === undefined,
        handler: context => context.root.withSegmentAtSelection(context.range, text => new CommentNode(new FormatNode("", [ new TextNode(text) ])))
    },
    {
        icon: ParagraphIcon,
        description: "format as paragraph",
        category: "level",
        mutates: true,
        control: true, alt: true, shift: false, code: "Digit0",
        visible: context => context.paragraph !== undefined && context.paragraph.getLevel() !== 0,
        active: context => context.paragraph !== undefined && context.paragraph.getLevel() !== 0,
        handler: context => {
            if(context.paragraph === undefined) return;
            return rootWithNode(context, context.paragraph, context.paragraph.withLevel(0));
        }
    },
    {
        icon: Header1Icon,
        description: "format as 1st level header",
        category: "level",
        mutates: true,
        control: true, alt: true, shift: false, code: "Digit1",
        visible: context => context.paragraph !== undefined,
        active: context => context.paragraph !== undefined && context.paragraph.getLevel() !== 1,
        handler: context => rootWithNode(context, context.paragraph, context.paragraph?.withLevel(1))
    },
    {
        icon: Header2Icon,
        description: "format as 2nd level header",
        category: "level",
        mutates: true,
        control: true, alt: true, shift: false, code: "Digit2",
        visible: context => context.paragraph !== undefined,
        active: context => context.paragraph !== undefined && context.paragraph.getLevel() !== 2,
        handler: context => rootWithNode(context, context.paragraph, context.paragraph?.withLevel(2))
    },
    {
        icon: Header3Icon,
        description: "format as 3rd level header",
        category: "level",
        mutates: true,
        control: true, alt: true, shift: false, code: "Digit3",
        visible: context => context.paragraph !== undefined,
        active: context => context.paragraph !== undefined && context.paragraph.getLevel() !== 3,
        handler: context => rootWithNode(context, context.paragraph, context.paragraph?.withLevel(3))
    },
    {
        icon: RuleIcon,
        description: "insert horizontal rule",
        category: "block",
        mutates: true,
        control: true, alt: false, shift: false, key: "u",
        visible: context => context.paragraph !== undefined,
        active: context => context.paragraph !== undefined && context.atParagraphStart,
        handler: context => context.paragraph ? rootWithNode(context, context.blocks, context.blocks?.withBlockInsertedBefore(context.paragraph, new RuleNode())) : undefined
    },
    {
        icon: CalloutIcon,
        description: "insert callout",
        category: "block",
        mutates: true,
        control: true, alt: false, shift: true, key: "-",
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
                    () => newParagraph.getFirstCaret()
                );
            }
        } 
    },
    {
        icon: QuoteIcon,
        description: "insert quote",
        category: "block",
        mutates: true,
        control: true, alt: false, shift: true, key: "'",
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
                    () => newParagraph.getFirstCaret()
                );
            }
        } 
    },
    {
        icon: CodeIcon,
        description: "insert code",
        category: "block",
        mutates: true,
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
                    () => { return { node: newCode.getCodeNode(), index: 0 } }
                );
            }
        } 
    },
    {
        icon: MediaIcon,
        description: "insert image or video",
        category: "block",
        mutates: true,
        control: true, alt: false, shift: true, key: "i",
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
                    () => newEmbed.getCaption().getFirstCaret()
                );
            }
        } 
    },
    {
        icon: TableIcon,
        description: "insert table",
        category: "block",
        mutates: true,
        control: true, alt: false, shift: false, key: "[",
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
                    () => { return { node: newTable.getRows()[0][0].getTextNodes()[0], index: 0 } }
                );
            }
        } 
    },
    {
        icon: BulletsIcon,
        description: "convert paragraph to bulleted list item",
        category: "list",
        mutates: true,
        control: true, alt: false, shift: true, key: "7",
        visible: context => context.paragraph !== undefined && context.list === undefined,
        active: context => context.paragraph !== undefined && context.list === undefined,
        handler: context => rootWithNode(context, context.blocks, context.blocks?.withParagraphsAsLists(context.range, false))
    },
    {
        icon: NumbersIcon,
        description: "convert paragraph to numbered list item",
        category: "list",
        mutates: true,
        control: true, alt: false, shift: true, key: "8",
        visible: context => context.paragraph !== undefined && context.list === undefined,
        active: context => context.paragraph !== undefined && context.list === undefined,
        handler: context => rootWithNode(context, context.blocks, context.blocks?.withParagraphsAsLists(context.range, true))
    },
    {
        icon: BulletsIcon,
        description: "convert numbered list item to bulleted",
        category: "list",
        mutates: true,
        control: true, alt: false, shift: true, key: "7",
        visible: context => context.list !== undefined && context.list.isNumbered(),
        active: context => context.list !== undefined && context.list.isNumbered(),
        handler: context => context.list ? rootWithNode(context, context.blocks, context.blocks?.withListAsStyle(context.list, false)) : undefined
    },
    {
        icon: NumbersIcon,
        description: "convert bulleted list item to numbered",
        category: "list",
        mutates: true,
        control: true, alt: false, shift: true, key: "8",
        visible: context => context.list !== undefined && !context.list.isNumbered(),
        active: context => context.list !== undefined && !context.list.isNumbered(),
        handler: context => context.list ? rootWithNode(context, context.blocks, context.blocks?.withListAsStyle(context.list, true)) : undefined
    },
    {
        icon: ParagraphIcon,
        description: "convert bulleted list item to paragraph",
        category: "list",
        mutates: true,
        control: true, alt: false, shift: true, key: ["7", "8"],
        visible: context => context.list !== undefined,
        active: context => context.list !== undefined,
        handler: context => rootWithNode(context, context.blocks, context.blocks?.withListsAsParagraphs(context.range))
    },
    {
        icon: UndoIcon,
        description: "undo the last command",
        category: "history",
        mutates: false,
        control: true, alt: false, shift: false, key: "z",
        visible: true,
        active: context => context.undoStack.length > 0 && context.undoPosition < context.undoStack.length - 1,
        handler: context => context.undo()
    },
    {
        icon: RedoIcon,
        description: "redo the most recently undone command",
        category: "history",
        mutates: false,
        control: true, alt: false, shift: false, key: "y",
        visible: true,
        active: context => context.undoPosition > 0,
        handler: context => context.redo()
    },
    {
        icon: CutIcon,
        description: "delete the selected content and copy it to the clipboard",
        category: "clipboard",
        mutates: true,
        control: true, alt: false, shift: false, key: "x",
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
        icon: CopyIcon,
        description: "copy the selected content to the clipboard",
        category: "clipboard",
        mutates: false,
        control: true, alt: false, shift: false, key: "c",
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
        icon: PasteIcon,
        description: "paste the content from the clipboard",
        category: "clipboard",
        mutates: false,
        control: true, alt: false, shift: false, key: "v",
        visible: true,
        active: () => true,
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

            // Return the current caret to avoid unhandled command feedback.
            return { root: context.root, range: context.range};
        }
    },
    {
        icon: "insert symbol",
        description: "insert character",
        category: "text",
        mutates: true,
        control: false, alt: false, shift: undefined, key: undefined,
        visible: false,
        active: (context, key) => context && key !== undefined && key.length === 1,
        handler: (context, utilities, key) => {
            utilities;
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
export default commands;