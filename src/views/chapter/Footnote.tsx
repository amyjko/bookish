import React, { useContext } from 'react'
import { ChapterContext } from './Chapter'
import Marginal  from './Marginal'
import { renderNode } from './Renderer'
import { FootnoteNode } from "../../models/FootnoteNode"

const Footnote = (props: { node: FootnoteNode }) => {

    const { node } = props
    const context = useContext(ChapterContext)

    // If no chapter was provided, then don't render the footnote, since there's no context in which to render it.
    if(!context || !context.chapter || !context.book || node.footnote === undefined)
        return <></>;

    // What footnote number is this?
    let number = context.chapter.getFootnotes().indexOf(node);
    let letter = context.book.getFootnoteSymbol(number);

    return <span className="bookish-footnote-link" data-nodeid={props.node.nodeID}>
        <Marginal 
            id={"footnote-" + number}
            interactor={<sup className="bookish-footnote-symbol">{letter}</sup>}
            content={<span className="bookish-footnote"><sup className="bookish-footnote-symbol">{letter}</sup> {renderNode(node.footnote)}</span>} 
        />
    </span>

}

export default Footnote