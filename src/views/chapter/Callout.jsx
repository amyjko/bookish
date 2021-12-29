import React from 'react'
import { renderNode, renderPosition } from './Renderer'

function Callout(props) {

    return <div key={props.key} className={"callout " + renderPosition(props.node.position)}>
        { props.node.elements.map((element, index) => renderNode(element, props.context, "callout-" + index))}
    </div>

}

export default Callout