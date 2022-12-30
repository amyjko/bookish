import type ChapterNode from './ChapterNode';
import type EmbedNode from './EmbedNode';
import type FormatNode from './FormatNode';

// Beware: BookishEditor checks for each of these in order to undo/redo. If you change this, check it's undo/redo logic too.
type RootNode = ChapterNode | FormatNode | EmbedNode;
export default RootNode;
