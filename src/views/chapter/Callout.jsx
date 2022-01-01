import React from 'react'
import { renderNode, renderPosition } from './Renderer'

function Callout(props) {

    return <div className={"bookish-callout " + renderPosition(props.node.position)}>
        { props.node.elements.map((element, index) => renderNode(element, "callout-" + index))}
    </div>

}

export default Callout