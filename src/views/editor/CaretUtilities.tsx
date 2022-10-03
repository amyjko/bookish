import { Caret } from "../../models/chapter/Caret";


export type CaretUtilities = {
    getCaretOnLine: (caret: Caret, below: boolean) => Caret;
};
