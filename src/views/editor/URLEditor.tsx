import React, { ChangeEvent, useRef, useState } from "react";

const URLEditor = (props: {
    url: string,
    valid: boolean,
    edit: (newURL: string) => void
}) => {

    function handleURLChange(e: ChangeEvent<HTMLInputElement>) {

        // Update the view
        props.edit.call(undefined, e.target.value);
    
    }

    return <input 
        type="text"
        tabIndex={0}
        className={props.valid ? "" : "bookish-editor-text-invalid"}
        value={props.url}
        onChange={handleURLChange}
        placeholder="e.g., https://bookish.press" 
    />;

}

export default URLEditor;