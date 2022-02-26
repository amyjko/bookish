import React, { ChangeEvent, useContext, useEffect, useRef, useState } from 'react'

import { Link as RouterLink } from 'react-router-dom';
import { HashLink } from "../util/HashLink"

import { renderNode } from './Renderer';
import smoothlyScrollElementToEyeLevel from '../util/Scroll'
import { BaseContext, EditorContext } from '../page/Book';
import { LinkNode } from "../../models/LinkNode";
import { CaretContext } from '../editor/ChapterEditor';
import { ChapterContext } from './Chapter';

const Link = (props: { node: LinkNode}) => {

    const { node } = props;
    const { base } = useContext(BaseContext);
    const caret = useContext(CaretContext);
    const chapter = useContext(ChapterContext);
    const { editable } = useContext(EditorContext)
    const [ editedURL, setEditedURL ] = useState<string>(node.getURL());
    const urlInput = useRef<HTMLInputElement>(null);

    const url = node.getURL();
    const content = node.getText();
    const contentDOM = renderNode(content);

    // Is the caret on this link?
    const textFocused = caret && caret.selection && caret.selection.start.node === node.getText();
    const urlFocused = caret && caret.selection && caret.selection.start.node === node;
    
    useEffect(() => {

        if(urlFocused && urlInput.current)
            urlInput.current.focus();

    }, [caret]);

    function handleChange(e: ChangeEvent<HTMLInputElement>) {

        // Update the view
        setEditedURL(e.target.value);

        // Update the model
        node.setURL(e.target.value);

    }

    function handleKeyDown(event: React.KeyboardEvent) {
        
        if(caret === undefined)
            return;

        // If up, then go back to the link's text node.
        if(event.key === "ArrowUp" || event.key === "Enter") {
            caret.setCaretRange({ start: { node: node.getText(), index: 0 }, end: { node: node.getText(), index: 0 }});
        }
        // If escape, remove the link.
        else if(event.key === "Escape") {
            const newCaret = node.unlink();
            caret.setCaretRange({ start: newCaret, end: newCaret });
        }

    }

    function handleMouseDown(event: React.MouseEvent) {

        // Select this node
        if(caret === undefined)
            return;

        // Select this so that the view stays focused.
        if(urlInput.current !== document.activeElement)
            caret.setCaretRange({ start: { node: node, index: 0 }, end: { node: node, index: 0 }});

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

    return editable ? 
        (
            textFocused || urlFocused ?
                <>
                    <span className="bookish-editor-link-editor">
                        <span className="bookish-editor-link">{contentDOM}</span>
                        <span className="bookish-editor-link-form">
                            <input 
                                type="text"
                                className={isValid(editedURL) ? "" : "bookish-editor-link-invalid"}
                                ref={urlInput}
                                value={editedURL}
                                onChange={handleChange}
                                onMouseDown={handleMouseDown}
                                onKeyDown={handleKeyDown}
                                placeholder="e.g., https://bookish.press" />
                        </span>
                    </span>
                </> 
            : 
            <span className="bookish-editor-link">{contentDOM}</span>
        ) :
        link;
    
}

export default Link