import React from 'react'
import { renderNode, renderPosition } from './Renderer'
import Code from './Code'
import Python from './Python'
import { CodeNode } from '../../models/Parser'

const CaptionedCode = (props: { node: CodeNode}) => {

    const { node } = props

    return <div className={"bookish-figure " + renderPosition(node.position)}>
        {
            node.language === "python" && node.executable ? 
                <Python code={node.code}></Python> :
                <div>
                    <Code editable={false} inline={false} language={node.language}>{node.code}</Code>
                    { node.language !== "plaintext" ? <div className="bookish-code-language">{node.language}</div> : null }
                </div>
        }
        <div className="bookish-figure-caption">{renderNode(node.caption)}</div>
    </div>

}

export default CaptionedCode