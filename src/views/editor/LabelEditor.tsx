import React, { useContext } from "react";
import { LabelNode } from "../../models/LabelNode";
import { ChapterContext } from "../chapter/Chapter";
import { CaretContext, CaretContextType } from "./BookishEditor";
import TextEditor from "./TextEditor";

const LabelEditor = (props: {
    label: LabelNode
}) => {

    const label = props.label;
    const context = useContext(ChapterContext);
    const caret = useContext<CaretContextType>(CaretContext);
    const chapter = context.chapter?.getAST();
    
    if(chapter === undefined) return null;
    
    return <code>
        <TextEditor 
            text={label.getMeta()} 
            label="Chapter label ID"
            placeholder="label ID"
            valid={ id => {
                if(id.length === 0) return "Can't be empty";
                if(!/^[a-z]+$/.test(id)) return "Can only be a-z";
                // If it's different than what it is and there's already one, then error.
                if(chapter.getLabels().filter(l => l.getMeta() === id).length > (label.getMeta() === id ? 1 : 0)) return "Another label has this ID";
            }}
            save={labelID => caret?.edit(label, label.withMeta(labelID)) }
            saveOnExit
        />
    </code>
}

export default LabelEditor;