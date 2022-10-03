import { ErrorNode } from "../../models/chapter/ErrorNode";
import { FormatNode } from "../../models/chapter/FormatNode";
import type { ReferenceNode } from "../../models/chapter/ReferenceNode";
import ErrorMessage from "./ErrorMessage";
import Format from "./Format";
import Reference from "./Reference";

export default function renderReference(node: FormatNode | ErrorNode | ReferenceNode) {
    return node instanceof FormatNode ? <Format node={node}/> :
        node instanceof ErrorNode ? <ErrorMessage node={node}/> :
        <Reference node={node} />
}