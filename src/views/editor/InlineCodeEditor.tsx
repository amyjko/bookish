import React from "react";
import { InlineCodeNode } from "../../models/InlineCodeNode";
import LanguageEditor from "./LanguageEditor";

const InlineCodeEditor = (props: {
    code: InlineCodeNode
}) => {

    const code = props.code;

    // TODO Immutable
    return <span>
        <LanguageEditor language={code.getMeta()} edit={lang => code.withMeta(lang)} />
    </span>

}

export default InlineCodeEditor;