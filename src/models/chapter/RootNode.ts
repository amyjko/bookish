import { ChapterNode } from "./ChapterNode";
import { EmbedNode } from "./EmbedNode";
import { FormatNode } from "./FormatNode";

// Beware: BookishEditor checks for each of these in order to undo/redo. If you change this, check it's undo/redo logic too.
export type RootNode = ChapterNode | FormatNode | EmbedNode;