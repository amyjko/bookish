import React, { useContext } from 'react'
import { ChapterContext } from './Chapter'
import { LabelNode } from "../../models/LabelNode"
import Atom from '../editor/Atom';
import { EditorContext } from '../page/Book';

const Label = (props: { node: LabelNode }) => {

    const { node } = props;
    const context = useContext(ChapterContext);
    const { editable } = useContext(EditorContext)

    const label = <span 
        className={"bookish-label" + (context.highlightedID === node.getMeta() ? " bookish-content-highlight" : "")} 
        id={node.getMeta()}
        data-nodeid={props.node.nodeID}
    >
        {editable ? "•" : ""}
    </span>

    return <Atom
        node={node}
        textView={label}
    />;
}

export default Label;