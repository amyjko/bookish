import React from 'react'
import { FormattedNode } from '../../models/Parser';

import { renderNode } from './Renderer'

const Formatted = (props: { node: FormattedNode}) => {

    const { node } = props
    
    const segmentDOMs = node.segments.map((segment, index) => renderNode(segment, "formatted-" + index));

    if(node.format === "*")
        return <strong>{segmentDOMs}</strong>;
    else if(node.format === "_")
        return <em>{segmentDOMs}</em>;
    else
        return <span>{segmentDOMs}</span>;

}

export default Formatted