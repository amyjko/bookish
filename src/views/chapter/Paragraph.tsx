import React from 'react'
import { ParagraphNode } from "../../models/ParagraphNode"
import { renderNode } from './Renderer'

const Paragraph = (props: { node: ParagraphNode}) => {

    return props.node.content === undefined ? <></> : <p data-nodeid={props.node.nodeID}>{renderNode(props.node.content)}</p>

}

export default Paragraph