import React from 'react'
import { FormatNode } from "../../models/chapter/FormatNode";

import { renderNode } from './Renderer'

const Format = (props: { node: FormatNode, placeholder?: string }) => {

    const { node, placeholder } = props
    
    const segmentDOMs = node.getSegments().map((segment, index) => renderNode(segment, "formatted-" + index));

    const format = node.getFormat();

    if(node.isEmptyText() && placeholder !== undefined)
        return <span data-nodeid={props.node.nodeID} className="bookish-editor-placeholder">{segmentDOMs}{placeholder}</span>
    else if(format === "*")
        return <strong data-nodeid={props.node.nodeID}>{segmentDOMs}</strong>;
    else if(format === "_")
        return <em data-nodeid={props.node.nodeID}>{segmentDOMs}</em>;
    else if(format === "^")
        return <sup data-nodeid={props.node.nodeID}>{segmentDOMs}</sup>;
    else if(format === "v")
        return <sub data-nodeid={props.node.nodeID}>{segmentDOMs}</sub>
    else
        return <span data-nodeid={props.node.nodeID}>{segmentDOMs}</span>;

}

export default Format;