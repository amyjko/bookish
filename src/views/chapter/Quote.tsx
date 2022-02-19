import React from 'react'
import { QuoteNode } from "../../models/QuoteNode"
import { renderNode, renderPosition } from './Renderer'

const Quote = (props: { node: QuoteNode}) => {

    const { node } = props
    const credit = node.getCredit();
    return <blockquote className={"bookish-blockquote " + renderPosition(node.getPosition())} data-nodeid={props.node.nodeID}>
        { node.getBlocks().map((element, index) => renderNode(element, "quote-" + index)) }
        { credit ? <div className="bookish-blockquote-caption"><span>{renderNode(credit)}</span></div> : null }
    </blockquote>

}

export default Quote