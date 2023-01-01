import type Caret from '$lib/models/chapter/Caret';
import type { CaretRange } from '$lib/models/chapter/Caret';
import type ParagraphNode from '$lib/models/chapter/ParagraphNode';
import type AtomNode from '$lib/models/chapter/AtomNode';
import type FormatNode from '$lib/models/chapter/FormatNode';
import type BlocksNode from '$lib/models/chapter/BlocksNode';
import type ListNode from '$lib/models/chapter/ListNode';
import type TableNode from '$lib/models/chapter/TableNode';
import type MetadataNode from '$lib/models/chapter/MetadataNode';
import type RootNode from '$lib/models/chapter/RootNode';
import type Edit from '$lib/models/chapter/Edit';
import type CodeNode from '$lib/models/chapter/CodeNode';
import type BlockNode from '$lib/models/chapter/BlockNode';
import type Clipboard from './Clipboard';
import type UndoState from './UndoState';
import type Node from '$lib/models/chapter/Node';

export type PasteContent = { plain: string | undefined };

type CaretContext = {
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
    handlePaste: (
        context: CaretContext,
        text: PasteContent | Node,
        save: boolean
    ) => Edit;
};

export default CaretContext;
