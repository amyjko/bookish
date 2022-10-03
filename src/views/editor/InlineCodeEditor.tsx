import { useContext } from "react";
import { InlineCodeNode } from "../../models/chapter/InlineCodeNode";
import { CaretContext, CaretContextType } from "./CaretContext";
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