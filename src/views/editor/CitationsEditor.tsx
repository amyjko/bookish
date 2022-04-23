import React, { useContext, useState } from "react";
import { CitationsNode } from "../../models/CitationsNode";
import { ChapterContext, ChapterContextType } from "../chapter/Chapter";
import Select, { MultiValue } from 'react-select';
import { CaretContext } from "./ChapterEditor";

const CitationsEditor = (props: {
    citations: CitationsNode
}) => {

    const citations = props.citations;
    const context = useContext<ChapterContextType>(ChapterContext);
    const book = context.book;
    const caret = useContext(CaretContext);

    const [ editedCitations, setEditedCitations ] = useState<string[]>(citations.getMeta());

    if(book === undefined)
        return null;

    function handleCitationsChange(newValue: MultiValue<{value: string, label: string}>) {

        let newCitations = newValue.map(val => val.value);
        citations.setMeta(newCitations);
        setEditedCitations(newCitations);
        // Hack to force re-render on chapter.
        if(caret && caret.range)
            caret.setCaretRange({ start: caret.range.start, end: caret.range.end });

    }

    return <span>
        <Select 
            isMulti 
            className="bookish-editor-select"
            placeholder="Choose one or more citations."
            value={ editedCitations.map(val => { return { value: val, label: val }; }) }
            options={Object.keys(book.getReferences()).sort().map(citationID => { return {value: citationID, label: citationID }; })} 
            onChange={handleCitationsChange}
        />
        {
            editedCitations.length === 0 ?
                <span className="bookish-editor-note bookish-editor-note-error">Choose at least one citation.</span> :
                null
        }
    </span>;

}

export default CitationsEditor;