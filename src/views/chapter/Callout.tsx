import React, { useContext } from 'react'
import { CalloutNode } from "../../models/CalloutNode"
import { Position } from "../../models/Position";
import { CaretContext } from '../editor/ChapterEditor';
import PositionEditor from '../editor/PositionEditor';
import { EditorContext } from '../page/Book';
import { renderNode, renderPosition } from './Renderer'

const Callout = (props: { node: CalloutNode }) => {

    const { node } = props;

    return <div className={"bookish-callout " + renderPosition(props.node.getPosition())} data-nodeid={props.node.nodeID}>
        { props.node.getBlocks().map((element, index) => renderNode(element, "callout-" + index))}
    </div>

}

export default Callout