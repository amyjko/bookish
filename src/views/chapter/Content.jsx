import React from 'react'
import { renderNode } from './Renderer'

function Content(props) {

    const { node, context, key } = props

    return <span key={key}>{ node.segments.map((segment, index) => renderNode(segment, context, "content-" + index))}</span>

}

export default Content