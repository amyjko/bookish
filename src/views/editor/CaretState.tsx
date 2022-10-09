import { Caret, CaretRange } from "../../models/chapter/Caret";
import { ParagraphNode } from "../../models/chapter/ParagraphNode";
import { AtomNode } from "../../models/chapter/AtomNode";
import { FormatNode } from "../../models/chapter/FormatNode";
import { BlocksNode } from "../../models/chapter/BlocksNode";
import { ListNode } from "../../models/chapter/ListNode";
import { TableNode } from "../../models/chapter/TableNode";
import { MetadataNode } from "../../models/chapter/MetadataNode";
import { RootNode } from "../../models/chapter/RootNode";
import { Edit } from "../../models/chapter/Edit";
import { CodeNode } from "../../models/chapter/CodeNode";
import { BlockNode } from "../../models/chapter/BlockNode";
import { Clipboard } from "./Clipboard";
import type { UndoState } from "./UndoState";
import type { Node } from "../../models/chapter/Node";

export type CaretState = {
    chapter: boolean;
    range: CaretRange;
    start: Caret;
    end: Caret;
    isSelection: boolean;
    root: RootNode;
    blocks: BlocksNode | undefined;
    paragraph: ParagraphNode | undefined;
    block: BlockNode | undefined;
    includesList: boolean;
    code: CodeNode | undefined;
    list: ListNode | undefined;
    table: TableNode | undefined;
    format: FormatNode | undefined;
    atom: AtomNode<any> | undefined;
    meta: MetadataNode<any> | undefined;
    startIsText: boolean;
    endIsText: boolean;
    startIsTextOrAtom: boolean;
    endIsTextOrAtom: boolean;
    atParagraphStart: boolean;
    undoStack: UndoState[];
    undoPosition: number;
    undo: () => Edit;
    redo: () => Edit;
    clipboard: Clipboard;
    handleCopy: (node: Node) => void;
    handlePaste: (context: CaretState, node: Node, save: boolean) => Edit;
};
