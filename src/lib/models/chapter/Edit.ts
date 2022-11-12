import type { CaretRange } from "./Caret";
import type Node from "./Node"

// Edits can either result in no change (represented by undefined) or a new root node and a selection in it.
type Edit = undefined | { root: Node, range: CaretRange };
export default Edit;