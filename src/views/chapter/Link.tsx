import React, { ChangeEvent, useContext, useEffect, useRef, useState } from 'react'

import { Link as RouterLink } from 'react-router-dom';
import { HashLink } from "../util/HashLink"

import { renderNode } from './Renderer';
import smoothlyScrollElementToEyeLevel from '../util/Scroll'
import { BaseContext, EditorContext } from '../page/Book';
import { LinkNode } from "../../models/LinkNode";

const Link = (props: { node: LinkNode}) => {

    const { node } = props;
    const { base } = useContext(BaseContext);
    const { editable } = useContext(EditorContext);

    const url = node.getMeta();
    const content = node.getText();
    const contentDOM = renderNode(content);
    
    return editable ? <span className="bookish-editor-link">{contentDOM}</span> :
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