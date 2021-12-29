import React from 'react'
import Code from './Code'

function InlineCode(props) {

    const { node, context, key } = props

    return <Code key={key} inline={true} language={node.language}>{node.code}</Code>

}

export default InlineCode