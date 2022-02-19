import React from 'react'
import { ChapterNode } from "../../models/ChapterNode"
import { renderNode } from './Renderer'

const ChapterBody = (props: { node: ChapterNode }) => {

    const { node } = props
    const errors = node.getErrors();

    return <div className="bookish-chapter-body" data-nodeid={props.node.nodeID}>
        {
            errors.length === 0 ? 
                null : 
                <p>
                    <span className="bookish-error">{errors.length + " " + (errors.length > 1 ? "errors" : "error")} below</span>
                </p>
        }
        { node.getBlocks().map((block, index) => renderNode(block, "block-" + index)) }
    </div>

}

export default ChapterBody