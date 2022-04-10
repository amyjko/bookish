import React, { useContext } from 'react'
import { CalloutNode } from "../../models/CalloutNode"
import { Position } from "../../models/Position";
import { CaretContext } from '../editor/ChapterEditor';
import PositionEditor from '../editor/PositionEditor';
import Switch from '../editor/Switch';
import { EditorContext } from '../page/Book';
import { renderNode, renderPosition } from './Renderer'

const Callout = (props: { node: CalloutNode }) => {

    const { node } = props;
    const position = node.getPosition();
    const { editable } = useContext(EditorContext);
    const caret = useContext(CaretContext);

    return <div className={"bookish-callout " + renderPosition(props.node.getPosition())} data-nodeid={props.node.nodeID}>
        { props.node.getBlocks().map((element, index) => renderNode(element, "callout-" + index))}
        { editable && caret && caret.range && caret.range.start.node.getClosestParentMatching(p => p === node) ?
            <PositionEditor 
                value={position} 
                edit={(value: string) => node.setPosition(value as Position)} 
            /> :
            null
        }
    </div>

}

export default Callout