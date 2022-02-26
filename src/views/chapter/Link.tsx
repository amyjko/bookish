import React, { ChangeEvent, useContext, useEffect, useRef, useState } from 'react'

import { Link as RouterLink } from 'react-router-dom';
import { HashLink } from "../util/HashLink"

import { renderNode } from './Renderer';
import smoothlyScrollElementToEyeLevel from '../util/Scroll'
import { BaseContext, EditorContext } from '../page/Book';
import { LinkNode } from "../../models/LinkNode";
import { CaretContext } from '../editor/ChapterEditor';
import { ChapterContext } from './Chapter';
import Atom from '../editor/Atom';

const Link = (props: { node: LinkNode}) => {

    const { node } = props;
    const { base } = useContext(BaseContext);
    const caret = useContext(CaretContext);
    const chapter = useContext(ChapterContext);
    const [ editedURL, setEditedURL ] = useState<string>(node.getMeta());
    const urlInput = useRef<HTMLInputElement>(null);

    const url = node.getMeta();
    const content = node.getText();
    const contentDOM = renderNode(content);

    // Is the caret on this link?
    const urlFocused = caret && caret.selection && caret.selection.start.node === node;
    
    useEffect(() => {
        if(urlFocused && urlInput.current)
            urlInput.current.focus();
    }, [caret]);

    function handleChange(e: ChangeEvent<HTMLInputElement>) {

        // Update the view
        setEditedURL(e.target.value);

        // Update the model
        node.setMeta(e.target.value);

    }

    function isValid(url: string) {

        // Is it a valid URL?
        try {
            let test = new URL(url);
            if(test.protocol === "http:" || test.protocol === "https:")
                return true;
        } catch (_) {}

        // Is it a valid chapter?
        return chapter && chapter.book && chapter.book.hasChapter(url);

    }

    // If this is external link, make an anchor that opens a new window.
    const link = url.startsWith("http") ?
        <a href={url} target="_blank">{contentDOM}</a> :
        url.indexOf(":") >= 0 ?
            // If the chapter isn't specified, set to the current chapter's id.
            url.split(":")[0] === "" ?
                <HashLink smooth scroll={smoothlyScrollElementToEyeLevel} to={"#" + url.split(":")[1]}>{contentDOM}</HashLink> :
                <HashLink smooth scroll={smoothlyScrollElementToEyeLevel} to={"/" + url.split(":")[0] + "#" + url.split(":")[1]}>{contentDOM}</HashLink> :
            // If this is internal link, make a route link to the chapter.
            <RouterLink to={base + "/" + url}>{contentDOM}</RouterLink>;

    return <Atom
        node={node}
        editingTextView={<span className="bookish-editor-link">{contentDOM}</span>}
        readingTextView={link}
        metaView={
            <input 
                type="text"
                className={isValid(editedURL) ? "" : "bookish-editor-link-invalid"}
                ref={urlInput}
                value={editedURL}
                onChange={handleChange}
                placeholder="e.g., https://bookish.press" 
            />
        }
    />
    
}

export default Link