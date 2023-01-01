import type Edit from '$lib/models/chapter/Edit';
import type CaretUtilities from './CaretUtilities';
import type CaretContext from './CaretContext';

type Command = {
    icon: string;
    description: string;
    category: string;
    control: boolean | undefined;
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
        key: string
    ) => Edit;
};

export default Command;
