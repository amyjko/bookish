import React from 'react'

function Rule(props) {

    const { node, context, key} = props

    return <span key={key} className={"label" + (context.app.getHighlightedID() === node.id ? " content-highlight" : "")} id={node.id}></span>

}

export default Rule