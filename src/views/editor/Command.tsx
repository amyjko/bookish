import type { Edit } from "../../models/chapter/Edit";
import type { CaretUtilities } from "./CaretUtilities";
import type { CaretState } from "./CaretState";

export type Command = {
    label?: string;
    icon?: string;
    description: string;
    category: string;
    control: boolean;
    alt: boolean;
    shift: boolean | undefined;
    key?: string | string[];
    code?: string;
    visible: boolean | ((context: CaretState) => boolean);
    active: boolean | ((context: CaretState, key?: string) => boolean);
    handler: (
        context: CaretState,
        utilities: CaretUtilities,
        key: string) => Edit;
};
