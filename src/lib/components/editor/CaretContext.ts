import type { CaretRange } from "$lib/models/chapter/Caret";
import type RootNode from "$lib/models/chapter/RootNode";
import type CaretState from "./CaretState";
import type Node from "$lib/models/chapter/Node";

type CaretContext = { 
    range: CaretRange | undefined, 
    coordinate: { x: number, y: number} | undefined,
    forceUpdate: Function,
    context: CaretState | undefined,
    edit: (previous: Node, edited: Node) => void,
    root: RootNode,
    focused: boolean
} | undefined;

export default CaretContext;