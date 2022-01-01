import React from 'react'
import { renderNode } from './Renderer'

function Superscript(props) {

    const { node, key } = props

    return node.superscript ?
        <sup key={key}>{renderNode(node.content)}</sup> :
        <sub key={key}>{renderNode(node.content)}</sub>

}

export default Superscript