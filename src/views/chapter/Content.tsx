import React from 'react'
import { renderNode } from './Renderer'
import { ContentNode } from '../../models/Parser'

const Content = (props: { node: ContentNode }) => {

    const { node } = props

    return <span>{ node.segments.map((segment, index) => renderNode(segment, "content-" + index))}</span>

}

export default Content