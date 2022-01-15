import React from 'react'
import { SubSuperscriptNode } from '../../models/Parser'
import { renderNode } from './Renderer'

 const Superscript = (props: { node: SubSuperscriptNode}) => {

    const { node } = props

    return node.superscript ?
        <sup>{renderNode(node.content)}</sup> :
        <sub>{renderNode(node.content)}</sub>

}

export default Superscript