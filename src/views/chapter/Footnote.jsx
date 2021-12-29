import React from 'react'
import Marginal  from './Marginal'
import { renderNode } from './Renderer'

function Definition(props) {

    const { node, context, key } = props

    // If no chapter was provided, then don't render the footnote, since there's no context in which to render it.
    if(!context)
        return null;

    // What footnote number is this?
    let number = context.chapter.getFootnotes().indexOf(node);
    let letter = context.app.getBook().getFootnoteSymbol(number);

    return <span className="footnote-link" key={key}>
        <Marginal 
            chapter={context.app}
            id={"footnote-" + number}
            interactor={<sup className="footnote-symbol">{letter}</sup>}
            content={<span className="footnote"><sup className="footnote-symbol">{letter}</sup> {renderNode(node.footnote, context)}</span>} 
        />
    </span>

}

export default Definition