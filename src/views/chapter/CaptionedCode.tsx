import React from 'react'
import { renderNode, renderPosition } from './Renderer'
import Code from './Code'
import Python from './Python'
import { CodeNode } from "../../models/CodeNode"

const CaptionedCode = (props: { node: CodeNode}) => {

    const { node } = props;
    const caption = node.getCaption()

    return <div className={"bookish-figure " + renderPosition(node.getPosition())} data-nodeid={props.node.nodeID}>
        {
            node.getLanguage() === "python" && node.isExecutable() ? 
                <Python node={node} code={node.getCode()}></Python> :
                <div>
                    <Code editable={false} inline={false} language={node.getLanguage()} nodeID={node.nodeID}>{node.getCode()}</Code>
                    { node.getLanguage() !== "plaintext" ? <div className="bookish-code-language">{node.getLanguage()}</div> : null }
                </div>
        }
        { 
            caption ? 
                <div className="bookish-figure-caption">{renderNode(caption)}</div>
                : 
                null
        }
    </div>

}

export default CaptionedCode