import React, { isValidElement, useContext } from 'react'

import { Link as RouterLink } from 'react-router-dom';
import { HashLink } from "../util/HashLink"

import { renderNode } from './Renderer';
import smoothlyScrollElementToEyeLevel from '../util/Scroll'
import { BaseContext, EditorContext } from '../page/Book';
import { LinkNode } from "../../models/chapter/LinkNode";
import { ChapterContext } from './Chapter';

const Link = (props: { node: LinkNode}) => {

    const { node } = props;
    const { base } = useContext(BaseContext);
    const { editable } = useContext(EditorContext);
    const context = useContext(ChapterContext);

    const url = node.getMeta();
    const content = node.getText();
    const contentDOM = renderNode(content);

    function isInvalidChapterLink() {
        // If it's internal, validate it.
        if(!url.startsWith("http")) {

            // Pull out any labels and just get the chapter name.
            let chapter = url;
            let label = null;
            if(url.indexOf(":") >= 0) {
                let parts = chapter.split(":");
                chapter = parts[0];
                label = parts[1];
            }

            if(chapter !== "" && context.book && !context.book.hasChapter(chapter))
                return true;

        }
        return false;
    }

    return editable ? <span className="bookish-editor-link">{contentDOM}</span> :
        // If this is an invalid chapter link, say so
        isInvalidChapterLink() ? 
            <span className="bookish-error">Unknown chapter name reference '{url}'</span> :
        // If this is external link, make an anchor that opens a new window.
        url.startsWith("http") ?
            <a href={url} target="_blank">{contentDOM}</a> :
        // If's a chapter link with a label
        url.indexOf(":") >= 0 ?
            // If the chapter isn't specified, set to the current chapter's id.
            url.split(":")[0] === "" ?
                <HashLink smooth scroll={smoothlyScrollElementToEyeLevel} to={"#" + url.split(":")[1]}>{contentDOM}</HashLink> :
                <HashLink smooth scroll={smoothlyScrollElementToEyeLevel} to={"/" + url.split(":")[0] + "#" + url.split(":")[1]}>{contentDOM}</HashLink> :
            // If this is internal link, make a route link to the chapter.
            <RouterLink to={base + "/" + url}>{contentDOM}</RouterLink>;

}

export default Link;