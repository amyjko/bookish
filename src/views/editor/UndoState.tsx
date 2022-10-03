import type { IndexRange } from "../../models/chapter/Caret";
import type { Command } from "./Command";


export type UndoState = {
    command: Command | undefined;
    bookdown: string;
    range: IndexRange;
};
