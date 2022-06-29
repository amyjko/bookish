import React, { ChangeEvent, useContext, useEffect, useRef, useState } from "react";
import { LabelNode } from "../../models/LabelNode";
import { ChapterContext } from "../chapter/Chapter";
import { CaretContext, CaretContextType } from "./BookishEditor";

const LabelEditor = (props: {
    label: LabelNode
}) => {

    const label = props.label;
    const context = useContext(ChapterContext);
    const caret = useContext<CaretContextType>(CaretContext);
    const [ labelID, setLabelID ] = useState<string>(label.getMeta());
     
    function handleChange(e: ChangeEvent<HTMLInputElement>) {
        setLabelID(e.target.value);
    }

    function handleBlur() {
        caret?.edit(label, label.withMeta(labelID));
    }

    function isValid() { 
        // At least one character and only appears once in the chapter's labels.
        return label.getMeta().length > 0 && context.chapter && context.chapter.getLabels().filter(l => l.getMeta() === label.getMeta()).length === 1;
    }

    return <span>
        <input 
            type="text"
            tabIndex={0}
            className={isValid() ? "" : "bookish-editor-text-invalid"}
            value={labelID}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="label ID"
        />
        {
            isValid() ?
                <span className="bookish-editor-note">You can link to this label using this ID.</span> :
                <span className="bookish-editor-note bookish-editor-note-error">Type a unique, non-empty ID for this label.</span>
        }
    </span>

}

export default LabelEditor;