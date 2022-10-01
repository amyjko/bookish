import React from 'react'
import { QuoteNode } from "../../models/chapter/QuoteNode"
import Format from './Format';
import { renderNode, renderPosition } from './Renderer'

const Quote = (props: { node: QuoteNode}) => {

    const { node } = props;
    const credit = node.getCredit();
    const position = node.getPosition();

    return <blockquote className={"bookish-blockquote " + renderPosition(position)} data-nodeid={props.node.nodeID}>
        { node.getBlocks().map((element, index) => renderNode(element, "quote-" + index)) }
        { credit ? <div className="bookish-blockquote-caption"><span><Format node={credit} placeholder="credit"/></span></div> : null }
    </blockquote>

}

export default Quote;