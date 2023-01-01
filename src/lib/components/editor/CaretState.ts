import type { CaretRange } from '$lib/models/chapter/Caret';
import type RootNode from '$lib/models/chapter/RootNode';
import type CaretContext from './CaretContext';
import type Node from '$lib/models/chapter/Node';
import type Command from './Command';

type CaretState = {
    root: RootNode;
    range: CaretRange | undefined;
    coordinate: { x: number; y: number } | undefined;
    context: CaretContext | undefined;
    edit: (previous: Node, edited: Node) => void;
    setCaret: (range: CaretRange) => void;
    executor: (command: Command, key: string) => void;
    focused: boolean;
};

export default CaretState;
