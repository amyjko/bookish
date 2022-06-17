import React, { useContext } from "react";
import { InlineCodeNode } from "../../models/InlineCodeNode";
import { CaretContext, CaretContextType } from "./ChapterEditor";
import LanguageEditor from "./LanguageEditor";

const InlineCodeEditor = (props: {
    code: InlineCodeNode
}) => {

    const code = props.code;
    const caret = useContext<CaretContextType>(CaretContext);

    return <span>
        <LanguageEditor language={code.getMeta()} edit={lang => caret?.edit(code, code.withMeta(lang)) } />
    </span>

}

export default InlineCodeEditor;