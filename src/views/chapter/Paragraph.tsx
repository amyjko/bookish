import React from 'react'
import { ParagraphNode } from "../../models/ParagraphNode"
import { renderNode } from './Renderer'

const Paragraph = (props: { node: ParagraphNode}) => {

    return props.node.getContent() === undefined ? <></> : <p data-nodeid={props.node.nodeID}>{renderNode(props.node.getContent())}</p>

}

export default Paragraph