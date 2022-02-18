import React from 'react'
import { SubSuperscriptNode } from "../../models/SubSuperscriptNode"
import { renderNode } from './Renderer'

 const Superscript = (props: { node: SubSuperscriptNode}) => {

    const { node } = props

    return node.content === undefined ? <></> :
        node.superscript ?
        <sup data-nodeid={props.node.nodeID}>{renderNode(node.content)}</sup> :
        <sub data-nodeid={props.node.nodeID}>{renderNode(node.content)}</sub>

}

export default Superscript