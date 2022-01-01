import React from 'react'
import Code from './Code'

function InlineCode(props) {

    const { node } = props

    return <Code inline={true} language={node.language}>{node.code}</Code>

}

export default InlineCode