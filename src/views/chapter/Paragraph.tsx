import React, { useContext } from 'react'
import { ParagraphNode } from "../../models/ParagraphNode"
import { ChapterContext } from './Chapter'
import { renderNode } from './Renderer'

const Paragraph = (props: { node: ParagraphNode}) => {

    const { node } = props
    const content = node.getFormat();
    const level = node.getLevel();
    const context = useContext(ChapterContext)
    const chapter = context.chapter?.getAST();

    const id = node.getLevel() === 0 ? undefined : "header-" + (chapter ? chapter.getHeaders().indexOf(node) : "")
    const classes = node.getLevel() === 0 ? undefined: "bookish-header" + (context.highlightedID === id ? " bookish-content-highlight" : "")

    return  content === undefined ? <></> :
        level === 0 ? <p data-nodeid={props.node.nodeID}>{renderNode(props.node.getFormat())}</p> :
        level === 1 ? <h2 className={classes} id={id} data-nodeid={props.node.nodeID}>{renderNode(content)}</h2> :
        level === 2 ? <h3 className={classes} id={id} data-nodeid={props.node.nodeID}>{renderNode(content)}</h3> :
            <h4 className={classes} id={id} data-nodeid={props.node.nodeID}>{renderNode(content)}</h4>

}

export default Paragraph