import { CaretRange } from "./Caret";
import { Node } from "./Node"

// Edits can either result in no change (represented by undefined) or a new root node and a selection in it.
export type Edit = undefined | { root: Node, range: CaretRange };