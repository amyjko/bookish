import React from 'react'
import { renderNode, renderPosition } from './Renderer'
import Code from './Code'
import Python from './Python'

function CaptionedCode(props) {

    const { node, key } = props

    return <div key={key} className={"bookish-figure " + renderPosition(node.position)}>
        {
            node.language === "python" && node.executable ? 
                <Python code={node.code}></Python> :
                <div>
                    <Code inline={false} language={node.language}>{node.code}</Code>
                    { node.language !== "plaintext" ? <div className="bookish-code-language">{node.language}</div> : null }
                </div>
        }
        <div className="bookish-figure-caption">{renderNode(node.caption)}</div>
    </div>

}

export default CaptionedCode