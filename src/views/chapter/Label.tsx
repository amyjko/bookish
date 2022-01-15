import React, { useContext } from 'react'
import { ChapterContext } from './Chapter'
import { LabelNode } from '../../models/Parser'

const Label = (props: { node: LabelNode }) => {

    const { node } = props
    const context = useContext(ChapterContext)

    return <span className={"bookish-label" + (context.highlightedID === node.id ? " bookish-content-highlight" : "")} id={node.id}></span>

}

export default Label