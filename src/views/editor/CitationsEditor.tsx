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

    if(book === undefined)
        return null;

    function handleCitationsChange(newValue: MultiValue<{value: string, label: string}>) {

        let newCitations = newValue.map(val => val.value);
        caret?.edit(citations, citations.withMeta(newCitations));

    }

    return <span>
        <Select 
            isMulti 
            className="bookish-editor-select"
            placeholder="Choose one or more citations."
            value={ citations.getMeta().map(val => { return { value: val, label: val }; }) }
            options={Object.keys(book.getReferences()).sort().map(citationID => { return {value: citationID, label: citationID }; })} 
            onChange={handleCitationsChange}
        />
        {
            citations.getMeta().length === 0 ?
                <span className="bookish-editor-note bookish-editor-note-error">Choose at least one citation.</span> :
                null
        }
    </span>;

}

export default CitationsEditor;