import { Node } from "./Node";

export type Caret = { node: Node; index: number; };
export type CaretRange = { start: Caret; end: Caret; };
export type TextRange = { start: number, end: number };