import React, { useContext, useEffect, useRef } from 'react'
import Code from './Code'
import { InlineCodeNode } from "../../models/chapter/InlineCodeNode"
import { renderNode } from './Renderer'
import { EditorContext } from '../page/Edition'

const InlineCode = (props: { node: InlineCodeNode }) => {

    const { node } = props

    const editable = useContext(EditorContext);

    const editableView = <span className="bookish-code bookish-code-inline hljs" data-nodeid={node.nodeID}>{renderNode(node.getText())}</span>;
    const staticView = <Code editable={false} inline={true} language={node.getMeta()} nodeID={node.getText().nodeID}>{node.getText().getText()}</Code>;

    return editable ? editableView : staticView;

}

export default InlineCode