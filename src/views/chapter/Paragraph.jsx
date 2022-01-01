import React from 'react'
import { renderNode } from './Renderer'

export default function Paragraph(props) {

    return <p>{renderNode(props.node.content)}</p>

}