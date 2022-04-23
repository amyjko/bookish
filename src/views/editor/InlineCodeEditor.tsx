import React, { ChangeEvent, useContext, useState } from "react";
import { InlineCodeNode } from "../../models/InlineCodeNode";
import { CaretContext } from "./ChapterEditor";
import LanguageEditor from "./LanguageEditor";

const InlineCodeEditor = (props: {
    code: InlineCodeNode
}) => {

    const code = props.code;
    const caret = useContext(CaretContext);

    return <span>
        <LanguageEditor language={code.getMeta()} edit={lang => code.setMeta(lang)} />
    </span>

}

export default InlineCodeEditor;