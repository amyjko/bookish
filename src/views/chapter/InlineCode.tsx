import React from 'react'
import Code from './Code'
import { InlineCodeNode } from '../../models/Parser'

const InlineCode = (props: { node: InlineCodeNode }) => {

    const { node } = props

    return <Code editable={false} inline={true} language={node.language}>{node.code}</Code>

}

export default InlineCode