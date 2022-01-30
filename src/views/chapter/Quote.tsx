import React from 'react'
import { QuoteNode } from "../../models/QuoteNode"
import { renderNode, renderPosition } from './Renderer'

const Quote = (props: { node: QuoteNode}) => {

    const { node } = props
    return <blockquote className={"bookish-blockquote " + renderPosition(node.position)} data-nodeid={props.node.nodeID}>
        { node.elements.map((element, index) => renderNode(element, "quote-" + index)) }
        { node.credit ? <div className="bookish-blockquote-caption"><span>{renderNode(node.credit)}</span></div> : null }
    </blockquote>

}

export default Quote