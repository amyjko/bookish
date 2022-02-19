import React from 'react'
import { SubSuperscriptNode } from "../../models/SubSuperscriptNode"
import { renderNode } from './Renderer'

 const Superscript = (props: { node: SubSuperscriptNode}) => {

    const { node } = props
    const isSuperscript = node.isSuperscript();
    const content = node.getContent();

    return content === undefined ? <></> :
        isSuperscript ?
        <sup data-nodeid={props.node.nodeID}>{renderNode(content)}</sup> :
        <sub data-nodeid={props.node.nodeID}>{renderNode(content)}</sub>

}

export default Superscript