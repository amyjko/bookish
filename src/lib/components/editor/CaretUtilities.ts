import type Caret from "../../models/chapter/Caret";

type CaretUtilities = {
    getCaretOnLine: (caret: Caret, below: boolean) => Caret;
}
export default CaretUtilities;
