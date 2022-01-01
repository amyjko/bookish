import React from 'react'
import { renderNode } from './Renderer'

function Content(props) {

    const { node, key } = props

    return <span key={key}>{ node.segments.map((segment, index) => renderNode(segment, "content-" + index))}</span>

}

export default Content