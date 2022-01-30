import React from 'react'
import { renderNode } from './Renderer'
import { ContentNode } from "../../models/ContentNode"

const Content = (props: { node: ContentNode }) => {

    const { node } = props

    return <span data-nodeid={props.node.nodeID}>{ node.segments.map((segment, index) => renderNode(segment, "content-" + index))}</span>

}

export default Content