import React from "react";
import { InlineCodeNode } from "../../models/InlineCodeNode";
import LanguageEditor from "./LanguageEditor";

const InlineCodeEditor = (props: {
    code: InlineCodeNode
}) => {

    const code = props.code;

    return <span>
        <LanguageEditor language={code.getMeta()} edit={lang => code.setMeta(lang)} />
    </span>

}

export default InlineCodeEditor;