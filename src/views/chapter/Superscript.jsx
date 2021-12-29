import React from 'react'
import { renderNode } from './Renderer'

function Superscript(props) {

    const { node, context, key } = props

    return node.superscript ?
        <sup key={key}>{renderNode(node.content, context)}</sup> :
        <sub key={key}>{renderNode(node.content, context)}</sub>

}

export default Superscript