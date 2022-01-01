// Functions for translating chapter AST nodes into React views.

import React from 'react'

import ChapterBody from './ChapterBody'
import Paragraph from './Paragraph'
import Figure from './Figure'
import Header from './Header'
import Rule from './Rule'
import BulletedList from './BulletedList'
import NumberedList from './NumberedList'
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
import Content from './Content'
import Superscript from './Superscript'
import Text from './Text'
import Error from './Error'
import Label from './Label'
import Reference from './Reference'

const renderers = {
    "chapter": ChapterBody,
    "paragraph": Paragraph,
    "embed": Figure,
    "header": Header,
    "rule": Rule,
    "bulleted": BulletedList,
    "numbered": NumberedList,
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
    "content": Content,
    "script": Superscript,
    "text": Text,
    "error": Error,
    "label": Label,
    "reference": Reference
}

// Given a node and an optional ID to distinguish children in lists
// find the function below to render it, call it, and return its value.
const renderNode = (node, key) => {
    
    if(!(node.type in renderers))
        throw Error("Couldn't find a renderer for AST node type '" + node.type)
        
    // Note: key is a React reserve name, so it's not actually passed as a prop to the element.
    return React.createElement(renderers[node.type], { node: node, key: key })

}

const renderPosition = (position) => position === "<" ? "bookish-marginal-left-inset" : position === ">" ? "bookish-marginal-right-inset" : ""

export { renderNode, renderPosition }