import React from 'react'
import Code from './Code'
import { InlineCodeNode } from "../../models/InlineCodeNode"

const InlineCode = (props: { node: InlineCodeNode }) => {

    const { node } = props

    return <Code editable={false} inline={true} language={node.getLanguage()} nodeID={node.nodeID}>{node.getCode()}</Code>

}

export default InlineCode