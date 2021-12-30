import React from 'react'

function Label(props) {

    const { node, context, key} = props

    return <span key={key} className={"bookish-label" + (context.app.getHighlightedID() === node.id ? " bookish-content-highlight" : "")} id={node.id}></span>

}

export default Label