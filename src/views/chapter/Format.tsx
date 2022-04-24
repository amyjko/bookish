import React from 'react'
import { FormatNode } from "../../models/FormatNode";

import { renderNode } from './Renderer'

const Format = (props: { node: FormatNode}) => {

    const { node } = props
    
    const segmentDOMs = node.getSegments().map((segment, index) => renderNode(segment, "formatted-" + index));

    const format = node.getFormat();

    if(format === "*")
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