import React from 'react'
import { renderNode, renderPosition } from './Renderer'
import Code from './Code'
import Python from './Python'
import { CodeNode } from "../../models/CodeNode"

const CaptionedCode = (props: { node: CodeNode}) => {

    const { node } = props

    return <div className={"bookish-figure " + renderPosition(node.position)} data-nodeid={props.node.nodeID}>
        {
            node.language === "python" && node.executable ? 
                <Python node={node} code={node.code}></Python> :
                <div>
                    <Code editable={false} inline={false} language={node.language} nodeID={node.nodeID}>{node.code}</Code>
                    { node.language !== "plaintext" ? <div className="bookish-code-language">{node.language}</div> : null }
                </div>
        }
        { 
            node.caption ? 
                <div className="bookish-figure-caption">{renderNode(node.caption)}</div>
                : 
                null
        }
    </div>

}

export default CaptionedCode