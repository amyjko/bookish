import type Caret from '#lib/models/chapter/Caret.js';
import type { CaretRange } from '#lib/models/chapter/Caret.js';
import type ParagraphNode from '#lib/models/chapter/ParagraphNode.js';
import type AtomNode from '#lib/models/chapter/AtomNode.js';
import type FormatNode from '#lib/models/chapter/FormatNode.js';
import type BlocksNode from '#lib/models/chapter/BlocksNode.js';
import type ListNode from '#lib/models/chapter/ListNode.js';
import type TableNode from '#lib/models/chapter/TableNode.js';
import type MetadataNode from '#lib/models/chapter/MetadataNode.js';
import type RootNode from '#lib/models/chapter/RootNode.js';
import type Edit from '#lib/models/chapter/Edit.js';
import type CodeNode from '#lib/models/chapter/CodeNode.js';
import type BlockNode from '#lib/models/chapter/BlockNode.js';
import type Clipboard from './Clipboard';
import type UndoState from './UndoState';
import type Node from '#lib/models/chapter/Node.js';

export type PasteContent = { plain: string | undefined };

export type Accent = '`' | "'" | '^' | '~' | ':';
export const Accents: Record<string, string> = {
    '`a': 'à',
    '`A': 'À',
    '`e': 'è',
    '`E': 'È',
    '`i': 'ì',
    '`I': 'Ì',
    '`o': 'ò',
    '`O': 'Ò',
    '`u': 'ù',
    '`U': 'Ù',
    "'a": 'á',
    "'A": 'Á',
    "'e": 'é',
    "'E": 'É',
    "'i": 'í',
    "'I": 'Í',
    "'o": 'ó',
    "'O": 'Ó',
    "'u": 'ú',
    "'U": 'Ú',
    '^a': 'â',
    '^A': 'Â',
    '^e': 'ê',
    '^E': 'Ê',
    '^i': 'î',
    '^I': 'Î',
    '^o': 'ô',
    '^O': 'Ô',
    '^u': 'û',
    '^U': 'Û',
    '~a': 'ã',
    '~A': 'Ã',
    '~e': 'ẽ',
    '~E': 'Ẽ',
    '~i': 'ĩ',
    '~I': 'Ĩ',
    '~o': 'õ',
    '~O': 'Õ',
    '~u': 'ũ',
    '~U': 'Ũ',
    ':a': 'ä',
    ':A': 'Ä',
    ':e': 'ë',
    ':E': 'Ë',
    ':i': 'ï',
    ':I': 'Ï',
    ':o': 'ö',
    ':O': 'Ö',
    ':u': 'ü',
    ':U': 'Ü',
};

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
    formatRoot: FormatNode | undefined;
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
        save: boolean,
    ) => Edit;
    setAccent: (accent: Accent | undefined) => void;
    getAccent: () => Accent | undefined;
};

export type { CaretContext as default };
