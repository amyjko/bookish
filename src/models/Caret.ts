import { AtomNode } from "./AtomNode";
import { TextNode } from "./TextNode";

export type Caret = { node: TextNode | AtomNode<any>; index: number; };
export type CaretRange = { start: Caret; end: Caret; };
export type TextRange = { start: number, end: number };