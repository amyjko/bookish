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

    if(node.url === undefined || node.content === undefined)
        return <></>;

    // If this is external link, make an anchor that opens a new window.
    if(node.url.startsWith("http")) {
        return <a href={node.url} target="_blank">{renderNode(node.content)}</a>;
    }
    else {
        if(node.url.indexOf(":") >= 0) {
            let [chapter, label] = node.url.split(":");
            // If the chapter isn't specified, set to the current chapter's id.
            if(chapter === "")
                return <HashLink smooth scroll={smoothlyScrollElementToEyeLevel} to={"#" + label}>{renderNode(node.content)}</HashLink>
            else
                return <HashLink smooth scroll={smoothlyScrollElementToEyeLevel} to={"/" + chapter + "#" + label}>{renderNode(node.content)}</HashLink>
        }
        else {
            // If this is internal link, make a route link to the chapter.
            return <RouterLink to={base + "/" + node.url}>{renderNode(node.content)}</RouterLink>
        }
    }

}

export default Link