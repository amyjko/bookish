import type Edit from '$lib/models/chapter/Edit';
import type CaretUtilities from './CaretUtilities';
import type CaretState from './CaretState';

type Command = {
    icon: string;
    description: string;
    category: string;
    control: boolean;
    alt: boolean;
    shift: boolean | undefined;
    key?: string | string[];
    code?: string;
    mutates: boolean;
    visible: boolean | ((context: CaretState) => boolean);
    active: boolean | ((context: CaretState, key?: string) => boolean);
    handler: (
        context: CaretState,
        utilities: CaretUtilities,
        key: string
    ) => Edit;
};

export default Command;
