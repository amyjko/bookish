import React from 'react'

import { renderNode } from './Renderer'

function Formatted(props) {

    const { node, key } = props
    
    const segmentDOMs = node.segments.map((segment, index) => renderNode(segment, "formatted-" + index));

    if(node.format === "*")
        return <strong key={key}>{segmentDOMs}</strong>;
    else if(node.format === "_")
        return <em key={key}>{segmentDOMs}</em>;
    else if(node.format === "`")
        return <Code key={key} inline={true} language={node.language}>{segmentDOMs}</Code>;
    else
        return <span key={key}>{segmentDOMs}</span>;

}

export default Formatted