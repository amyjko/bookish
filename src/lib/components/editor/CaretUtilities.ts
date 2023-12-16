import type Caret from '../../models/chapter/Caret';

type CaretUtilities = {
    getCaretOnLine: (caret: Caret, below: boolean) => Caret;
};
export type { CaretUtilities as default };
