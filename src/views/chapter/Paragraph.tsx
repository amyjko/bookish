import React from 'react'
import { ParagraphNode } from '../../models/Parser'
import { renderNode } from './Renderer'

const Paragraph = (props: { node: ParagraphNode}) => {

    return <p>{renderNode(props.node.content)}</p>

}

export default Paragraph