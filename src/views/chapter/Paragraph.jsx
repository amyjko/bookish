import React from 'react'
import { renderNode } from './Renderer'

function Paragraph(props) {

    return <p key={props.key}>{renderNode(props.node.content, props.context)}</p>

}

export default Paragraph