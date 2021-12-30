import React from 'react'
import { renderNode }  from './Renderer'

function Header(props) {

    const { node, context, key } = props

    let id = "header-" + context.chapter.getHeaders().indexOf(node)
    let classes = "bookish-header " + (context.app.getHighlightedID() === id ? "bookish-content-highlight" : "")

    return  node.level === 1 ? <h2 key={key} className={classes} id={id}>{renderNode(node.content, context)}</h2> :
            node.level === 2 ? <h3 key={key} className={classes} id={id}>{renderNode(node.content, context)}</h3> :
                <h4 key={key} className={classes} id={id}>{renderNode(node.content, context)}</h4>

}

export default Header