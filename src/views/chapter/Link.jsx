import React from 'react'

import { Link as RouterLink } from 'react-router-dom';
import { NavHashLink } from "react-router-hash-link"

import { renderNode } from './Renderer';
import smoothlyScrollElementToEyeLevel from '../util/Scroll'

function Link(props) {

    const { node, context, key } = props

    // If this is external link, make an anchor that opens a new window.
    if(node.url.startsWith("http")) {
        return <a key={key} href={node.url} target="_blank">{renderNode(node.content, context)}</a>;
    }
    else {
        if(node.url.indexOf(":") >= 0) {
            let [chapter, label] = node.url.split(":");
            // If the chapter isn't specified, set to the current chapter's id.
            if(chapter === "")
                return <NavHashLink key={key} smooth scroll={smoothlyScrollElementToEyeLevel} to={"#" + label}>{renderNode(node.content, context)}</NavHashLink>;
            else
                return <NavHashLink key={key} smooth scroll={smoothlyScrollElementToEyeLevel} to={"/" + chapter + "#" + label}>{renderNode(node.content, context)}</NavHashLink>;
        }
        else {
            // If this is internal link, make a route link to the chapter.
            return <RouterLink key={key} to={node.url}>{renderNode(node.content, context)}</RouterLink>;
        }
    }

}

export default Link