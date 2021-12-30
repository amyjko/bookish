import React from 'react'
import { renderNode, renderPosition } from './Renderer'

function Quote(props) {

    const { node, context, key } = props
    return <blockquote key={key} className={"bookish-blockquote " + renderPosition(node.position)}>
        { node.elements.map((element, index) => renderNode(element, context, "quote-" + index)) }
        { node.credit ? <div className="bookish-blockquote-caption"><span>{renderNode(node.credit, context)}</span></div> : null }
    </blockquote>

}

export default Quote