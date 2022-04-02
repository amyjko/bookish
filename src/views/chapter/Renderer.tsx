import React from 'react'

import { Position } from '../../models/Parser'
import { Node } from "../../models/Node"
import ChapterBody from './ChapterBody'
import Paragraph from './Paragraph'
import Figure from './Figure'
import Rule from './Rule'
import List from './List'
import CaptionedCode from './CaptionedCode'
import Quote from './Quote'
import Callout from './Callout'
import Table from './Table'
import Formatted from './Formatted'
import InlineCode from './InlineCode'
import Link from './Link'
import Citations from './Citations'
import Definition from './Definition'
import Footnote from './Footnote'
import Text from './Text'
import ErrorMessage from './ErrorMessage'
import Label from './Label'
import Reference from './Reference'
import Comment from './Comment'

const renderers: Record<string, (props: { node: any }) => JSX.Element> = {
    "chapter": ChapterBody,
    "paragraph": Paragraph,
    "embed": Figure,
    "rule": Rule,
    "list": List,
    "code": CaptionedCode,
    "quote": Quote,
    "callout": Callout,
    "table": Table,
    "formatted": Formatted,
    "inline-code": InlineCode,
    "link": Link,
    "citations": Citations,
    "definition": Definition,
    "footnote": Footnote,
    "text": Text,
    "error": ErrorMessage,
    "label": Label,
    "reference": Reference,
    "comment": Comment
}

// Given a node and an optional ID to distinguish children in lists
// find the function below to render it, call it, and return its value.
const renderNode = (node: Node, key?: string) => {
    
    if(!(node.type in renderers))
        throw Error(`Couldn't find a renderer for AST node type "${node.type}"`)

    const componentType: (props: { node: any }) => JSX.Element = renderers[node.type];

    // Note: key is a React reserve name, so it's not actually passed as a prop to the element.
    return React.createElement(componentType, { node: node, key: key })

}

const renderPosition = (position: Position) => 
    position === "<" ? "bookish-marginal-left-inset" : 
    position === ">" ? "bookish-marginal-right-inset" : 
    ""

export { renderNode, renderPosition }