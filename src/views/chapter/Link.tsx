import React, { useContext } from 'react'

import { Link as RouterLink } from 'react-router-dom';
import { HashLink } from "../util/HashLink"

import { renderNode } from './Renderer';
import smoothlyScrollElementToEyeLevel from '../util/Scroll'
import { BaseContext } from '../page/Book';
import { LinkNode } from "../../models/LinkNode";

const Link = (props: { node: LinkNode}) => {

    const { node } = props
    const { base } = useContext(BaseContext)
    const url = node.getURL();
    const content = node.getText();

    if(url === undefined || content === undefined)
        return <></>;

    // If this is external link, make an anchor that opens a new window.
    if(url.startsWith("http")) {
        return <a href={url} target="_blank">{renderNode(content)}</a>;
    }
    else {
        if(url.indexOf(":") >= 0) {
            let [chapter, label] = url.split(":");
            // If the chapter isn't specified, set to the current chapter's id.
            if(chapter === "")
                return <HashLink smooth scroll={smoothlyScrollElementToEyeLevel} to={"#" + label}>{renderNode(content)}</HashLink>
            else
                return <HashLink smooth scroll={smoothlyScrollElementToEyeLevel} to={"/" + chapter + "#" + label}>{renderNode(content)}</HashLink>
        }
        else {
            // If this is internal link, make a route link to the chapter.
            return <RouterLink to={base + "/" + url}>{renderNode(content)}</RouterLink>
        }
    }

}

export default Link