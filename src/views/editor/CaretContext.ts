import { CaretRange } from "../../models/chapter/Caret";
import { RootNode } from "../../models/chapter/RootNode";
import { CaretState } from "./CaretState";
import { Node as BookishNode } from "../../models/chapter/Node";
import React from "react";

export type CaretContextType = { 
    range: CaretRange | undefined, 
    coordinate: { x: number, y: number} | undefined,
    setCaretRange: Function,
    forceUpdate: Function,
    context: CaretState | undefined,
    edit: (previous: BookishNode, edited: BookishNode) => void,
    root: RootNode,
    focused: boolean
} | undefined;

export const CaretContext = React.createContext<CaretContextType>(undefined);
