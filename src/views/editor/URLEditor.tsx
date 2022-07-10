import React from "react";
import TextEditor from "./TextEditor";

const URLEditor = (props: {
    url: string,
    validator: (text: string) => undefined | string,
    edit: (newURL: string) => void
}) => {

    return <TextEditor
        placeholder="url" 
        text={props.url} 
        label="URL editor"
        valid={ url => props.validator.call(undefined, url) }
        save={ url => props.edit.call(undefined, url) }
        width={20}
        clip={true}
    />;

}

export default URLEditor;