import React, { ChangeEvent, useContext, useState } from "react";
import { CaretContext } from "./BookishEditor";


const LanguageEditor = (props: {
    language: string,
    edit : (newValue: string) => void
}) => {

    const caret = useContext(CaretContext);
    const languages = [ "C", "C++", "CSS", "Go", "HTML", "Java", "JavaScript", "Markdown", "Plaintext", "Python", "TypeScript" ];

    function handleLanguageChange(e: ChangeEvent<HTMLSelectElement>) {
        props.edit.call(undefined, e.target.value);
        // Force an update on the chapter.
        if(caret)
            caret.forceUpdate();
    
    }

    return <>
        <select onChange={handleLanguageChange} value={props.language}>
            { languages.map(lang => <option key={lang} value={lang.toLocaleLowerCase()}>{lang}</option>) }
        </select>
        <span className="bookish-editor-note">Choose a programming language to enable syntax highlighting.</span>
    </>    

}

export default LanguageEditor;