import React from 'react'
import { renderNode } from './Renderer'

function Content(props) {

    const { node } = props

    return <span>{ node.segments.map((segment, index) => renderNode(segment, "content-" + index))}</span>

}

export default Content