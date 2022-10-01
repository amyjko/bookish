import React from "react";
import TextEditor from "./TextEditor";

const URLEditor = (props: {
    url: string,
    validator: (text: string) => undefined | string,
    edit: (newURL: string) => string | undefined
}) => {

    return <TextEditor
        placeholder="url" 
        text={props.url} 
        label="URL editor"
        valid={ url => props.validator(url) }
        save={ url => props.edit(url) }
        width={20}
        clip={true}
    />;

}

export default URLEditor;