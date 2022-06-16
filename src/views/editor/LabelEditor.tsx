import React, { ChangeEvent, useContext, useRef, useState } from "react";
import { LabelNode } from "../../models/LabelNode";
import { ChapterContext } from "../chapter/Chapter";
import { EditorContext } from "../page/Book";

const LabelEditor = (props: {
    label: LabelNode
}) => {

    const context = useContext(ChapterContext);
    const { editable } = useContext(EditorContext)
    const label = props.label;

    function handleChange(e: ChangeEvent<HTMLInputElement>) {

        // TODO Immutable
        // Update the model
        label.withMeta(e.target.value);

    }

    function isValid() { 

        // At least one character and only appears once.
        return label.getMeta().length > 0 && context.chapter && context.chapter.getLabels().filter(label => label.getMeta() === label.getMeta()).length === 1;

    }

    return <span>
        <input 
            type="text"
            tabIndex={0}
            className={isValid() ? "" : "bookish-editor-text-invalid"}
            value={label.getMeta()}
            onChange={handleChange}
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