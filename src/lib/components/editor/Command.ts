import type Edit from '$lib/models/chapter/Edit';
import type CaretUtilities from './CaretUtilities';
import type CaretContext from './CaretContext';

export type CommandCategory =
    | 'navigation'
    | 'selection'
    | 'text'
    | 'history'
    | 'clipboard'
    | 'annotation'
    | 'block'
    | 'level'
    | 'list'
    | 'table';

type Command = {
    icon: string;
    description: string;
    category: CommandCategory;
    control: boolean | undefined;
    press?: boolean | undefined;
    alt: boolean | undefined;
    shift: boolean | undefined;
    key?: string | string[] | ((key: string) => boolean);
    code?: string;
    mutates: boolean;
    visible: boolean | ((context: CaretContext) => boolean);
    active: boolean | ((context: CaretContext, key?: string) => boolean);
    handler: (
        context: CaretContext,
        utilities: CaretUtilities,
        key: string,
        code: string,
    ) => Edit | true;
};

export type { Command as default };
