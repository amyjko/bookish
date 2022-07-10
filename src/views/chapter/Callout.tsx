import React from 'react'
import { CalloutNode } from "../../models/chapter/CalloutNode"
import { renderNode, renderPosition } from './Renderer'

const Callout = (props: { node: CalloutNode }) => {

    const { node } = props;

    return <div className={"bookish-callout " + renderPosition(props.node.getPosition())} data-nodeid={props.node.nodeID}>
        { props.node.getBlocks().map((element, index) => renderNode(element, "callout-" + index))}
    </div>

}

export default Callout