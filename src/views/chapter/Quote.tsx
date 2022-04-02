import React, { useContext } from 'react'
import { Position } from '../../models/Parser'
import { QuoteNode } from "../../models/QuoteNode"
import { CaretContext } from '../editor/ChapterEditor'
import PositionEditor from '../editor/PositionEditor'
import Switch from '../editor/Switch'
import { EditorContext } from '../page/Book'
import { renderNode, renderPosition } from './Renderer'

const Quote = (props: { node: QuoteNode}) => {

    const { node } = props;
    const credit = node.getCredit();
    const position = node.getPosition();

    const { editable } = useContext(EditorContext);
    const caret = useContext(CaretContext);

    return <blockquote className={"bookish-blockquote " + renderPosition(position)} data-nodeid={props.node.nodeID}>
        { node.getBlocks().map((element, index) => renderNode(element, "quote-" + index)) }
        { credit ? <div className="bookish-blockquote-caption"><span>{renderNode(credit)}</span></div> : null }
        { editable && caret && caret.range && caret.range.start.node.getClosestParentMatching(p => p === node) ?
            <PositionEditor 
                value={position} 
                edit={(value: string) => node.setPosition(value as Position)} 
            /> :
            null
        }
    </blockquote>

}

export default Quote;