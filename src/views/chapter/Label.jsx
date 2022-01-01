import React, { useContext } from 'react'
import { ChapterContext } from './Chapter'

function Label(props) {

    const { node } = props
    const context = useContext(ChapterContext)

    return <span className={"bookish-label" + (context.highlightedID === node.id ? " bookish-content-highlight" : "")} id={node.id}></span>

}

export default Label