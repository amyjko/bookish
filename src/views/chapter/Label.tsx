import React, { useContext } from 'react'
import { ChapterContext } from './Chapter'
import { LabelNode } from "../../models/LabelNode"

const Label = (props: { node: LabelNode }) => {

    const { node } = props
    const context = useContext(ChapterContext)

    return <span 
        className={"bookish-label" + (context.highlightedID === node.getID() ? " bookish-content-highlight" : "")} 
        id={node.getID()}
        data-nodeid={props.node.nodeID}
    >
    </span>

}

export default Label