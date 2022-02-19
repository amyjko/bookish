import React, { useContext } from 'react'
import { ChapterContext } from './Chapter'
import { renderNode }  from './Renderer'
import { HeaderNode } from "../../models/HeaderNode"

const Header = (props: { node: HeaderNode }) => {

    const { node } = props
    const content = node.getContent();
    const level = node.getLevel();
    const context = useContext(ChapterContext)

    const id = "header-" + (context.chapter ? context.chapter.getHeaders().indexOf(node) : "")
    const classes = "bookish-header" + (context.highlightedID === id ? " bookish-content-highlight" : "")

    return  content === undefined ? <></> :
            level === 1 ? <h2 className={classes} id={id} data-nodeid={props.node.nodeID}>{renderNode(content)}</h2> :
            level === 2 ? <h3 className={classes} id={id} data-nodeid={props.node.nodeID}>{renderNode(content)}</h3> :
                <h4 className={classes} id={id} data-nodeid={props.node.nodeID}>{renderNode(content)}</h4>

}

export default Header