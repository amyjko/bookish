import React, { useContext } from 'react'
import { ChapterContext } from './Chapter'
import { renderNode }  from './Renderer'
import { HeaderNode } from "../../models/HeaderNode"

const Header = (props: { node: HeaderNode }) => {

    const { node } = props
    const context = useContext(ChapterContext)

    const id = "header-" + (context.chapter ? context.chapter.getHeaders().indexOf(node) : "")
    const classes = "bookish-header" + (context.highlightedID === id ? " bookish-content-highlight" : "")

    return  node.content === undefined ? <></> :
            node.level === 1 ? <h2 className={classes} id={id} data-nodeid={props.node.nodeID}>{renderNode(node.content)}</h2> :
            node.level === 2 ? <h3 className={classes} id={id} data-nodeid={props.node.nodeID}>{renderNode(node.content)}</h3> :
                <h4 className={classes} id={id} data-nodeid={props.node.nodeID}>{renderNode(node.content)}</h4>

}

export default Header