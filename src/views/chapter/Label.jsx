import React, { useContext } from 'react'
import { ChapterContext } from './Chapter'

function Label(props) {

    const { node, key} = props
    const context = useContext(ChapterContext)

    return <span key={key} className={"bookish-label" + (context.highlightedID === node.id ? " bookish-content-highlight" : "")} id={node.id}></span>

}

export default Label