import { Node } from "./Node";

export type Caret = { node: Node; index: number; };
export type CaretRange = { start: Caret; end: Caret; };