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
import { FormattedNode } from "../../models/FormattedNode";
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

export type Command = {
    label?: string,
    icon?: Function,
    description: string
    mouse: boolean,
    category: string,
    control: boolean,
    alt: boolean,
    shift: boolean,
    key?: string,
    code?: string,
    active: (context: CaretState) => boolean,
    handler: (
        context: CaretState,
        utilities: CaretUtilities,
        key: string) => CaretRange
}

function insertTableRowColumn(table: TableNode, format: FormattedNode, row: boolean, before: boolean): CaretRange | undefined {
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

function deleteTableRowColumn(table: TableNode, format: FormattedNode, row: boolean): CaretRange | undefined {
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

function convertToListItem(range: CaretRange, blocks: BlocksNode, paragraph: ParagraphNode, list: ListNode | undefined, numbered: boolean): CaretRange {
    if(!blocks || !paragraph) return range;
    if(list) {
        list.setNumbered(numbered);
    } else {
        const newList = new ListNode(blocks, [], numbered);
        const format = paragraph.getContent();
        newList.append(format);
        paragraph.replaceWith(newList);
    }
    return range;
}

function unwrapListItem(blocks: BlocksNode, list: ListNode, format: FormattedNode) {
    // Duplicate the list
    const before = list.copyItemsBeforeAfter(format, true);
    const after = list.copyItemsBeforeAfter(format, false);
    if(before && after) {
        const newParagraph = new ParagraphNode(blocks);
        newParagraph.setContent(format);
        blocks.replaceChild(list, newParagraph);
        if(before.getLength() > 0)
        blocks.insertBefore(newParagraph, before);
        if(after.getLength() > 0)
        blocks.insertAfter(newParagraph, after);
    }
}

// An ordered list of command specifications for keyboard and mouse input.
export const commands: Command[] = [
    {
        label: "row ↑",
        description: "insert row above",
        mouse: true,
        category: "table",
        control: false, alt: true, shift: false, key: "ArrowUp",
        active: context => context.format !== undefined && context.table !== undefined,
        handler: context => {
            if(!context.table || !context.format) return context.range;
            const range = insertTableRowColumn(context.table, context.format, true, true);
            return range ? range : context.range;
        }
    },
    {
        label: "row ↓",
        description: "insert row below",
        mouse: true,
        category: "table",
        control: false, alt: true, shift: false, key: "ArrowDown",
        active: context => context.format !== undefined && context.table !== undefined,
        handler: context => {
            if(!context.table || !context.format) return context.range;
            const range = insertTableRowColumn(context.table, context.format, true, false);
            return range ? range : context.range;
        }
    },
    {
        label: "col →",
        description: "insert column after",
        mouse: true,
        category: "table",
        control: false, alt: true, shift: false, key: "ArrowRight",
        active: context => context.format !== undefined && context.table !== undefined,
        handler: context => {
            if(!context.table || !context.format) return context.range;
            const range = insertTableRowColumn(context.table, context.format, false, false);
            return range ? range : context.range;
        }
    },
    {
        label: "col ←",
        description: "insert column before",
        mouse: true,
        category: "table",
        control: false, alt: true, shift: false, key: "ArrowLeft",
        active: context => context.format !== undefined && context.table !== undefined,
        handler: context => {
            if(!context.table || !context.format) return context.range;
            const range = insertTableRowColumn(context.table, context.format, false, true);
            return range ? range : context.range;
        }
    },
    {
        label: "\u232B row",
        description: "delete row",
        mouse: true,
        category: "table",
        control: false, alt: true, shift: false, key: "Backspace",
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
        mouse: true,
        category: "table",
        control: false, alt: true, shift: true, key: "Backspace",
        active: context => context.format !== undefined && context.table !== undefined && context.table.getColumnCount() > 1,
        handler: context => {
            if(!context.table || !context.format) return context.range;
            const range = deleteTableRowColumn(context.table, context.format, false);
            return range ? range : context.range;
        }
    },
    {
        description: "move to previous character",
        mouse: false,
        category: "navigation",
        control: false, alt: false, shift: false, key: "ArrowLeft",
        active: context => context.endIsTextOrAtom,
        handler: context => {
            const previous = (context.end.node as TextNode).previous(context.end.index);
            return { start: previous, end: previous };
        }
    },
    {
        description: "move to previous word",
        mouse: false,
        category: "navigation",
        control: false, alt: true, shift: false, key: "ArrowLeft",
        active: context => context.endIsTextOrAtom,
        handler: context => {
            const previous = (context.end.node as TextNode).previousWord(context.end.index);
            return { start: previous, end: previous };
        }
    },
    {
        description: "move to paragraph start",
        mouse: false,
        category: "navigation",
        control: true, alt: false, shift: false, key: "ArrowLeft",
        active: context => context.format !== undefined,
        handler: context => {
            const first = (context.format as FormattedNode).getFirstTextNode();
            return { start: { node: first, index: 0 }, end: { node: first, index: 0 }};
        }
    },
    {
        description: "expand selection to previous character",
        mouse: false,
        category: "selection",
        control: false, alt: false, shift: true, key: "ArrowLeft",
        active: context => context.endIsTextOrAtom,
        handler: context => {
            const previous = (context.end.node as TextNode).previous(context.end.index);
            return { start: context.start, end: previous };
        }
    },
    {
        description: "expand selection to previous word",
        mouse: false,
        category: "selection",
        control: false, alt: true, shift: true, key: "ArrowLeft",
        active: context => context.endIsTextOrAtom,
        handler: context => {
            const previous = (context.end.node as TextNode).previousWord(context.end.index);
            return { start: context.start, end: previous };
        }
    },
    {
        description: "expand selection to start",
        mouse: false,
        category: "selection",
        control: true, alt: false, shift: true, key: "ArrowLeft",
        active: context => context.format !== undefined,
        handler: context => {
            const first = (context.format as FormattedNode).getFirstTextNode();
            return { start: context.start, end: { node: first, index: 0 } };
        }
    },
    {
        description: "move to next character",
        mouse: false,
        category: "navigation",
        control: false, alt: false, shift: false, key: "ArrowRight",
        active: context => context.endIsTextOrAtom,
        handler: context => {
            const next = (context.end.node as TextNode).next(context.end.index);
            return { start: next, end: next };
        }
    },
    {
        description: "move to next word",
        mouse: false,
        category: "navigation",
        control: false, alt: true, shift: false, key: "ArrowRight",
        active: context => context.endIsTextOrAtom,
        handler: context => {
            const next = (context.end.node as TextNode).nextWord(context.end.index);
            return { start: next, end: next };
        }
    },
    {
        description: "move to paragraph end",
        mouse: false,
        category: "navigation",
        control: true, alt: false, shift: false, key: "ArrowRight",
        active: context => context.format !== undefined,
        handler: context => {
            const last = (context.format as FormattedNode).getLastTextNode();
            const caret = { node: last, index: last.getLength() };
            return { start: caret, end: caret};
        }
    },
    {
        description: "expand selection to next character",
        mouse: false,
        category: "selection",
        control: false, alt: false, shift: true, key: "ArrowRight",
        active: context => context.endIsTextOrAtom,
        handler: context => {
            const previous = (context.end.node as TextNode).next(context.end.index);
            return { start: context.start, end: previous };
        }
    },
    {
        description: "expand selection to next word",
        mouse: false,
        category: "selection",
        control: false, alt: true, shift: true, key: "ArrowRight",
        active: context => context.endIsTextOrAtom,
        handler: context => {
            const previous = (context.end.node as TextNode).nextWord(context.end.index);
            return { start: context.start, end: previous };
        }
    },
    {
        description: "expand selection to end",
        mouse: false,
        category: "selection",
        control: true, alt: false, shift: true, key: "ArrowRight",
        active: context => context.format !== undefined,
        handler: context => {
            const last = (context.format as FormattedNode).getLastTextNode();
            return { start: context.start, end: { node: last, index: 0 } };
        }
    },
    {
        description: "move up one line",
        mouse: false,
        category: "navigation",
        control: false, alt: false, shift: false, key: "ArrowUp",
        active: context => context.startIsTextOrAtom,
        handler: (context, utilities) => {
            const above = utilities.getCaretOnLine(context.start, false);
            return { start: above, end: above };
        }
    },
    {
        description: "move selection up one line",
        mouse: false,
        category: "selection",
        control: false, alt: false, shift: true, key: "ArrowUp",
        active: context => context.startIsTextOrAtom,
        handler: (context, utilities) => {
            const above = utilities.getCaretOnLine(context.end, false);
            return { start: context.start, end: above };
        }
    },
    {
        description: "move up down line",
        mouse: false,
        category: "navigation",
        control: false, alt: false, shift: false, key: "ArrowDown",
        active: context => context.startIsTextOrAtom,
        handler: (context, utilities) => {
            const below = utilities.getCaretOnLine(context.start, true);
            return { start: below, end: below };
        }
    },
    {
        description: "move selection down one line",
        mouse: false,
        category: "selection",
        control: false, alt: false, shift: true, key: "ArrowDown",
        active: context => context.startIsTextOrAtom,
        handler: (context, utilities) => {
            const below = utilities.getCaretOnLine(context.end, true);
            return { start: context.start, end: below };
        }
    },
    {
        description: "delete list item",
        mouse: false,
        category: "list",
        control: false, alt: false, shift: false, key: "Backspace",
        active: context => (context.start.node.getClosestParentMatching(p => p instanceof ListNode) as ListNode)?.atBeginningOfItem(context.start) !== undefined,
        handler: context => {
            const list = context.start.node.getClosestParentMatching(p => p instanceof ListNode) as ListNode;
            const newCaret = list.backspaceItemContaining(context.start);
            return { start: newCaret, end: newCaret };
        }
    },
    {
        description: "delete previous character",
        mouse: false,
        category: "text",
        control: false, alt: false, shift: false, key: "Backspace",
        active: context => context.chapter !== undefined,
        handler: context => {
            const caret = (context.chapter as ChapterNode).deleteSelection({ start: context.start, end: context.end }, true);
            return { start: caret, end: caret };
        }
    },
    {
        description: "delete next character",
        mouse: false,
        category: "text",
        control: false, alt: false, shift: false, key: "Delete",
        active: context => context.chapter !== undefined,
        handler: context => {
            const caret = (context.chapter as ChapterNode).deleteSelection({ start: context.start, end: context.end }, false);
            return { start: caret, end: caret };
        }
    },
    {
        description: "insert code newline",
        mouse: false,
        category: "text",
        control: false, alt: false, shift: false, key: "Enter",
        active: context => context.start.node.getParent() instanceof CodeNode,
        handler: context => {
            const caret = (context.start.node as TextNode).insert("\n", context.start.index);
            return { start: caret, end: caret }
        }
    },
    {
        description: "split list item",
        mouse: false,
        category: "list",
        control: false, alt: false, shift: false, key: "Enter",
        active: context => context.start.node.getClosestParentMatching(p => p instanceof ListNode) !== undefined,
        handler: context => {
            const list = context.start.node.getClosestParentMatching(p => p instanceof ListNode) as ListNode;
            const format = context.start.node.getClosestParentMatching(p => p instanceof FormattedNode) as FormattedNode;
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
        mouse: false,
        category: "paragraph",
        control: false, alt: false, shift: false, key: "Enter",
        active: context => context.chapter !== undefined,
        handler: context => {
            const caret = (context.chapter as ChapterNode).splitSelection(context.range);
            return { start: caret, end: caret };
        }
    },        
    {
        label: "indent",
        icon: Indent,
        description: "indent list item",
        mouse: true,
        category: "list",
        control: false, alt: false, shift: false, key: "Tab",
        active: context => context.start.node.closestParent(ListNode) !== undefined,
        handler: context => {
            const list = context.start.node.closestParent(ListNode) as ListNode;
            list.indent(context.start);
            return { start: context.start, end: context.end };
        }
    },        
    {
        label: "unindent",
        icon: Unindent,
        description: "unindent list item",
        mouse: true,
        category: "list",
        control: false, alt: false, shift: true, key: "Tab",
        active: context => context.start.node.closestParent(ListNode) !== undefined,
        handler: context => {
            const list = context.start.node.closestParent(ListNode) as ListNode;
            list.unindent(context.start);
            return { start: context.start, end: context.end };
        }
    },
    {
        label: "plain",
        icon: Clear,
        description: "clear formatting",
        mouse: true,
        category: "text",
        control: true, alt: false, shift: false, key: "i",
        active: context => context.chapter !== undefined,
        handler: context => context.chapter ? context.chapter.formatSelection(context.range, "") : context.range
    },
    {
        label: "bold",
        icon: Bold,
        description: "bold",
        mouse: true,
        category: "text",
        control: true, alt: false, shift: false, key: "b",
        active: context => context.chapter !== undefined,
        handler: context => context.chapter ? context.chapter.formatSelection(context.range, "*") : context.range
    },
    {
        description: "italic",
        icon: Italic,
        mouse: true,
        category: "text",
        control: true, alt: false, shift: false, key: "i",
        active: context => context.chapter !== undefined,
        handler: context => context.chapter ? context.chapter.formatSelection(context.range, "_") : context.range
    },
    {
        label: "<code>",
        icon: Code,
        description: "toggle code",
        mouse: true,
        category: "text",
        control: true, alt: false, shift: false, key: "j",
        active: context => context.chapter !== undefined,
        handler: context => {
            const caret = context.chapter?.toggleAtom(context.range, InlineCodeNode, (parent, text) => new InlineCodeNode(parent, text));
            return caret ? { start: caret, end: caret} : context.range;
        }
    },
    {
        label: "sub\u2099",
        icon: Subscript,
        description: "subscript",
        mouse: true,
        category: "text",
        control: true, alt: false, shift: false, key: ",",
        active: context => context.chapter !== undefined,
        handler: context => context.chapter ? context.chapter.formatSelection(context.range, "v") : context.range
    },
    {
        label: "super\u207F",
        icon: Superscript,
        description: "superscript",
        mouse: true,
        category: "text",
        control: true, alt: false, shift: false, key: ".",
        active: context => context.chapter !== undefined,
        handler: context => context.chapter ? context.chapter.formatSelection(context.range, "^") : context.range
    },
    {
        label: "link ⚭",
        icon: Link,
        description: "toggle link",
        mouse: true,
        category: "annotation",
        control: true, alt: false, shift: false, key: "k",
        active: context => context.chapter !== undefined,
        handler: context => {
            const caret = context.chapter?.toggleAtom(context.range, LinkNode, (parent, text) => new LinkNode(parent, text));
            return caret ? { start: caret, end: caret} : context.range;
        }
    },
    {
        label: "glossary",
        description: "toggle definition",
        mouse: true,
        category: "annotation",
        control: true, alt: false, shift: false, key: "d",
        active: context => context.chapter !== undefined,
        handler: context => {
            const caret = context.chapter?.toggleAtom(context.range, DefinitionNode, (parent, text) => new DefinitionNode(parent, text));
            return caret ? { start: caret, end: caret} : context.range;
        }
    },
    {
        label: "footnote",
        description: "insert footnote",
        mouse: true,
        category: "annotation",
        control: true, alt: false, shift: false, key: "f",
        active: context => context.chapter !== undefined,
        handler: context => {
            const caret = context.chapter?.insertNodeAtSelection(context.range, (parent, text) => new FootnoteNode(parent, text));
            return caret ? { start: caret, end: caret} : context.range;
        }
    },
    {
        label: "cite",
        description: "insert citations",
        mouse: true,
        category: "annotation",
        control: true, alt: false, shift: false, key: "t",
        active: context => context.chapter !== undefined,
        handler: context => {
            const caret = context.chapter?.insertNodeAtSelection(context.range, (parent, text) => new CitationsNode(parent, []));
            return caret ? { start: caret, end: caret} : context.range;
        }
    },
    {
        label: "label",
        description: "insert label",
        mouse: true,
        category: "annotation",
        control: true, alt: false, shift: false, key: "l",
        active: context => context.chapter !== undefined,
        handler: context => {
            const caret = context.chapter?.insertNodeAtSelection(context.range, (parent, text) => new LabelNode(parent, ""));
            return caret ? { start: caret, end: caret} : context.range;
        }
    },
    {
        label: "comment",
        icon: Comment,
        description: "insert comment",
        mouse: true,
        category: "annotation",
        control: true, alt: false, shift: false, key: "c",
        active: context => context.chapter !== undefined,
        handler: context => {
            const caret = context.chapter?.insertNodeAtSelection(context.range, (parent, text) => new CommentNode(parent, ""));
            return caret ? { start: caret, end: caret} : context.range;
        }
    },
    {
        label: "paragraph",
        icon: Paragraph,
        description: "format as paragraph",
        mouse: true,
        category: "level",
        control: true, alt: true, shift: false, code: "Digit0",
        active: context => context.paragraph !== undefined,
        handler: context => {
            context.paragraph?.setLevel(0);
            return context.range;
        }
    },
    {
        label: "h1",
        description: "format as 1st level header",
        mouse: true,
        category: "level",
        control: true, alt: true, shift: false, code: "Digit1",
        active: context => context.paragraph !== undefined,
        handler: context => {
            context.paragraph?.setLevel(1);
            return context.range;
        }
    },
    {
        label: "h2",
        description: "format as 2nd level header",
        mouse: true,
        category: "level",
        control: true, alt: true, shift: false, code: "Digit2",
        active: context => context.paragraph !== undefined,
        handler: context => {
            context.paragraph?.setLevel(2);
            return context.range;
        }
    },
    {
        label: "h3",
        description: "format as 3rd level header",
        mouse: true,
        category: "level",
        control: true, alt: true, shift: false, code: "Digit3",
        active: context => context.paragraph !== undefined,
        handler: context => {
            context.paragraph?.setLevel(3);
            return context.range;
        }
    },
    {
        label: "\u2014",
        description: "insert horizontal rule",
        mouse: true,
        category: "block",
        control: true, alt: false, shift: true, key: "h",
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
        mouse: true,
        category: "block",
        control: true, alt: false, shift: true, key: "e",
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
        mouse: true,
        category: "block",
        control: true, alt: false, shift: true, key: "u",
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
        mouse: true,
        category: "block",
        control: true, alt: false, shift: true, key: "s",
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
        mouse: true,
        category: "block",
        control: true, alt: false, shift: true, key: "p",
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
        mouse: true,
        category: "block",
        control: true, alt: false, shift: true, key: "\\",
        active: context => context.blocks !== undefined && context.atParagraphStart,
        handler: context => {
            if(context.blocks && context.paragraph) {
                const table = new TableNode(context.blocks, []);

                // Add some rows and columns, relying on the table
                for(let r = 0; r < Math.max(1, 3); r++) table.addRow(0);
                for(let c = 0; c < Math.max(1, 3); c++) table.addColumn(0);

                // Set a default caption
                const caption = new FormattedNode(table, "", []);
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
        mouse: true,
        category: "list",
        control: true, alt: false, shift: true, key: "7",
        active: context => context.blocks !== undefined && context.paragraph !== undefined,
        handler: context => {
            if(!context.blocks || !context.paragraph) return context.range;
            return convertToListItem(context.range, context.blocks, context.paragraph, context.list, false);
        }
    },
    {
        label: "numbered",
        icon: Numbers,
        description: "convert paragraph to numbered list item",
        mouse: true,
        category: "list",
        control: true, alt: false, shift: true, key: "8",
        active: context => context.blocks !== undefined && context.paragraph !== undefined && (context.list === undefined || !context.list.isNumbered()),
        handler: context => {
            if(!context.blocks || !context.paragraph) return context.range;
            return convertToListItem(context.range, context.blocks, context.paragraph, context.list, true);
        }
    },
    {
        label: "bulleted",
        icon: Bullets,
        description: "convert numbered list item to bulleted",
        mouse: true,
        category: "list",
        control: true, alt: false, shift: true, key: "7",
        active: context => context.list !== undefined && context.list.isNumbered(),
        handler: context => {
            if(!context.list) return context.range;
            context.list.setNumbered(false);
            return context.range;
        }
    },
    {
        label: "numbered",
        icon: Numbers,
        description: "convert bulleted list item to numbered",
        mouse: true,
        category: "list",
        control: true, alt: false, shift: true, key: "8",
        active: context => context.list !== undefined && !context.list.isNumbered(),
        handler: context => {
            if(!context.list) return context.range;
            context.list.setNumbered(true);
            return context.range;
        }
    },
    {
        label: "paragraph",
        icon: Paragraph,
        description: "convert list item to paragraph",
        mouse: true,
        category: "list",
        control: true, alt: false, shift: true, key: "7",
        active: context => context.list !== undefined && !context.list.isNumbered(),
        handler: context => {
            if(!context.blocks || !context.list || !context.format) return context.range;
            unwrapListItem(context.blocks, context.list, context.format);
            return context.range;
        }
    },
    {
        label: "paragraph",
        icon: Paragraph,
        description: "convert list item to paragraph",
        mouse: true,
        category: "list",
        control: true, alt: false, shift: true, key: "8",
        active: context => context.list !== undefined && context.list.isNumbered(),
        handler: context => {
            if(!context.blocks || !context.list || !context.format) return context.range;
            unwrapListItem(context.blocks, context.list, context.format);
            return context.range;
        }
    }
];