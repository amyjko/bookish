import type { IndexRange } from '#lib/models/chapter/Caret.js';
import type Command from '#lib/components/editor/Command.js';

type UndoState = {
    command: Command | undefined;
    bookdown: string;
    range: IndexRange;
};
export type { UndoState as default };
