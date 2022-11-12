import type { IndexRange } from "$lib/models/chapter/Caret";
import type Command from "$lib/components/editor/Command";


type UndoState = {
    command: Command | undefined;
    bookdown: string;
    range: IndexRange;
};
export default UndoState;