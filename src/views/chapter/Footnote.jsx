import React, { useContext } from 'react'
import { ChapterContext } from './Chapter'
import Marginal  from './Marginal'
import { renderNode } from './Renderer'

function Definition(props) {

    const { node } = props
    const context = useContext(ChapterContext)

    // If no chapter was provided, then don't render the footnote, since there's no context in which to render it.
    if(!context || !context.chapter || !context.book)
        return null;

    // What footnote number is this?
    let number = context.chapter.getFootnotes().indexOf(node);
    let letter = context.book.getFootnoteSymbol(number);

    return <span className="bookish-footnote-link">
        <Marginal 
            id={"footnote-" + number}
            interactor={<sup className="bookish-footnote-symbol">{letter}</sup>}
            content={<span className="bookish-footnote"><sup className="bookish-footnote-symbol">{letter}</sup> {renderNode(node.footnote)}</span>} 
        />
    </span>

}

export default Definition