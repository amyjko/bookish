import React from 'react'
import { renderNode, renderPosition } from './Renderer'

function Quote(props) {

    const { node } = props
    return <blockquote className={"bookish-blockquote " + renderPosition(node.position)}>
        { node.elements.map((element, index) => renderNode(element, "quote-" + index)) }
        { node.credit ? <div className="bookish-blockquote-caption"><span>{renderNode(node.credit)}</span></div> : null }
    </blockquote>

}

export default Quote