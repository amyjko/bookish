import React from 'react'
import Code from './Code'
import { InlineCodeNode } from "../../models/InlineCodeNode"

const InlineCode = (props: { node: InlineCodeNode }) => {

    const { node } = props

    return <Code editable={false} inline={true} language={node.language} nodeID={node.nodeID}>{node.code}</Code>

}

export default InlineCode