import React from 'react'
import { FormattedNode } from "../../models/FormattedNode";

import { renderNode } from './Renderer'

const Segments = (props: { node: FormattedNode}) => {

    const { node } = props
    
    const segmentDOMs = node.segments.map((segment, index) => renderNode(segment, "formatted-" + index));

    if(node.format === "*")
        return <strong data-nodeid={props.node.nodeID}>{segmentDOMs}</strong>;
    else if(node.format === "_")
        return <em data-nodeid={props.node.nodeID}>{segmentDOMs}</em>;
    else
        return <span data-nodeid={props.node.nodeID}>{segmentDOMs}</span>;

}

export default Segments