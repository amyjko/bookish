import React from 'react'

import { renderNode } from './Renderer'

function Formatted(props) {

    const { node } = props
    
    const segmentDOMs = node.segments.map((segment, index) => renderNode(segment, "formatted-" + index));

    if(node.format === "*")
        return <strong>{segmentDOMs}</strong>;
    else if(node.format === "_")
        return <em>{segmentDOMs}</em>;
    else if(node.format === "`")
        return <Code inline={true} language={node.language}>{segmentDOMs}</Code>;
    else
        return <span>{segmentDOMs}</span>;

}

export default Formatted