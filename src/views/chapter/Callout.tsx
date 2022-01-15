import React from 'react'
import { CalloutNode } from '../../models/Parser'
import { renderNode, renderPosition } from './Renderer'

const Callout = (props: { node: CalloutNode }) => {

    return <div className={"bookish-callout " + renderPosition(props.node.position)}>
        { props.node.elements.map((element, index) => renderNode(element, "callout-" + index))}
    </div>

}

export default Callout