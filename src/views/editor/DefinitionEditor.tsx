import React, { ChangeEvent, useContext, useRef, useState } from "react";
import { DefinitionNode } from "../../models/DefinitionNode";
import { ChapterContext, ChapterContextType } from "../chapter/Chapter";
import { CaretContext } from "./ChapterEditor";

const DefinitionEditor = (props: {
    definition: DefinitionNode
}) => {

    const definition = props.definition;
    const context = useContext<ChapterContextType>(ChapterContext);
    const book = context.book;
    const caret = useContext(CaretContext);
    const selectRef = useRef<HTMLSelectElement>(null);
 
    // If there's no context, render nothing.
    if(!context || !context.book)
        return <></>

    const glossary = context.book.getGlossary();

    if(book === undefined)
        return null;

    function handleChange(e: ChangeEvent<HTMLSelectElement>) {
        caret?.edit(definition, definition.withMeta(e.target.value))
    }

    // Sort the glossary entries by phrase
    const entries = Object.keys(glossary).map(key => { return { glossaryID: key, phrase: glossary[key].phrase }; }).sort((a, b) => a.phrase.localeCompare(b.phrase));
    
    return <span>
        <select 
            ref={selectRef} 
            tabIndex={0} 
            value={definition.getMeta()} 
            onChange={handleChange}
        >
            <option value=""></option>
            { entries.map((entry, index) => <option key={index} value={entry.glossaryID}>{entry.phrase}</option>)}
        </select>
        {
            definition.getMeta() in glossary ?
                null :
                <span className="bookish-editor-note bookish-editor-note-error">Choose a glossary entry to link to this phrase.</span>
        }
    </span>;

}

export default DefinitionEditor;