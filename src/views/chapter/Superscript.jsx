import React from 'react'
import { renderNode } from './Renderer'

export default function Superscript(props) {

    const { node } = props

    return node.superscript ?
        <sup>{renderNode(node.content)}</sup> :
        <sub>{renderNode(node.content)}</sub>

}