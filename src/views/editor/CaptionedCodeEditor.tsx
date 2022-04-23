import React, { useContext } from "react";
import { CodeNode } from "../../models/CodeNode";
import { Position } from "../../models/Position";
import { CaretContext } from "./ChapterEditor";
import LanguageEditor from "./LanguageEditor";
import PositionEditor from "./PositionEditor";
import Switch from "./Switch";

const CaptionedCodeEditor = (props: {
    code: CodeNode
}) => {

    const code = props.code;
    const caret = useContext(CaretContext);

    return <span>
        <PositionEditor
            value={code.getPosition()}
            edit={(value: string) => code.setPosition(value as Position) }
        />
        <LanguageEditor language={code.getLanguage()} edit={lang => code.setLanguage(lang) } />
        { code.getLanguage() !== "python" ? null : 
            <Switch
                options={["executable", "read only"]}
                value={code.isExecutable() ? "executable" : "read only"}
                position=">"
                edit={(value: string) => code.setExecutable(value === "executable")}
            />
        }

    </span>

}

export default CaptionedCodeEditor;