import React from 'react'
import { renderNode } from './Renderer'

function ChapterBody(props) {

    const { node } = props
    const errors = node.metadata.errors

    return <div className="bookish-chapter-body">
        {
            errors.length === 0 ? 
                null : 
                <p>
                    <span className="bookish-error">{errors.length + " " + (errors.length > 1 ? "errors" : "error")} below</span>
                </p>
        }
        { node.blocks.map((block, index) => renderNode(block, "block-" + index)) }
    </div>

}

export default ChapterBody