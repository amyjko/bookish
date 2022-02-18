import React from 'react'
import { CalloutNode } from "../../models/CalloutNode"
import { renderNode, renderPosition } from './Renderer'

const Callout = (props: { node: CalloutNode }) => {

    return <div className={"bookish-callout " + renderPosition(props.node.position)} data-nodeid={props.node.nodeID}>
        { props.node.blocks.map((element, index) => renderNode(element, "callout-" + index))}
    </div>

}

export default Callout