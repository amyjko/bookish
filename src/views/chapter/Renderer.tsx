import React from 'react'

import { Position } from "../../models/chapter/Position"
import { Node } from "../../models/chapter/Node"
import ChapterBody from './ChapterBody'
import Paragraph from './Paragraph'
import Embed from './Embed'
import Rule from './Rule'
import List from './List'
import CaptionedCode from './CaptionedCode'
import Quote from './Quote'
import Callout from './Callout'
import Table from './Table'
import Format from './Format'
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
    "embed": Embed,
    "rule": Rule,
    "list": List,
    "code": CaptionedCode,
    "quote": Quote,
    "callout": Callout,
    "table": Table,
    "formatted": Format,
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
    const type = node.getType();
    if(!(type in renderers))
        throw Error(`Couldn't find a renderer for AST node type "${type}"`)

    const componentType: (props: { node: any }) => JSX.Element = renderers[type];

    // Note: key is a React reserve name, so it's not actually passed as a prop to the element.
    return React.createElement(componentType, { node: node, key: key })

}

const renderPosition = (position: Position) => 
    position === "<" ? "bookish-marginal-left-inset" : 
    position === ">" ? "bookish-marginal-right-inset" : 
    ""

export { renderNode, renderPosition }