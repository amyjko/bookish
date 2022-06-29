import React, { useContext } from "react";
import { CodeNode } from "../../models/CodeNode";
import { Position } from "../../models/Position";
import { CaretContext, CaretContextType } from "./BookishEditor";
import LanguageEditor from "./LanguageEditor";
import PositionEditor from "./PositionEditor";
import Switch from "./Switch";

const CaptionedCodeEditor = (props: {
    code: CodeNode
}) => {

    const code = props.code;
    const caret = useContext<CaretContextType>(CaretContext);

    return <span>
        <PositionEditor
            value={code.getPosition()}
            edit={(value: string) => caret?.edit(code, code.withPosition(value as Position)) }
        />
        <LanguageEditor language={code.getLanguage()} edit={lang => caret?.edit(code, code.withLanguage(lang)) } />
        { code.getLanguage() !== "python" ? null : 
            <Switch
                options={["executable", "read only"]}
                value={code.isExecutable() ? "executable" : "read only"}
                position=">"
                edit={(value: string) => caret?.edit(code, code.withExecutable(value === "executable")) }
            />
        }

    </span>

}

export default CaptionedCodeEditor;