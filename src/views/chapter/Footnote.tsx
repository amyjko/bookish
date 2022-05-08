import React, { useContext, useEffect } from 'react'
import { ChapterContext } from './Chapter'
import Marginal  from './Marginal'
import { renderNode } from './Renderer'
import { FootnoteNode } from "../../models/FootnoteNode"
import Atom from '../editor/Atom'

const Footnote = (props: { node: FootnoteNode }) => {

    const { node } = props
    const footnote = node.getMeta();
    const context = useContext(ChapterContext);

    // If no chapter was provided, then don't render the footnote, since there's no context in which to render it.
    if(!context || !context.chapter || !context.book)
        return <></>;

    // What footnote number is this?
    let number = context.chapter.getFootnotes().indexOf(node);
    let letter = context.book.getFootnoteSymbol(number);

    // Position the marginals on every render.
    useEffect(() => {
        if(context && context.layoutMarginals) {
            context.layoutMarginals();
        }
    });
    
    function handleMouseDown(event: React.MouseEvent) {
        // This odd little statement prevents mouse events from bubbling up to the footnote symbol. This is key for two reasons:
        // 1) clicks on the footnote select the footnote atom node itself
        // 2) we want to be able to click on footnote text and we can't do that if the footnote sets the caret to the atom after clicks.
        event?.stopPropagation();
    }
    
    return <Atom
        node={node}
        textView={
            <span className={`bookish-footnote-link`} data-nodeid={props.node.nodeID}>
                <Marginal 
                    id={"footnote-" + number}
                    interactor={<sup className="bookish-footnote-symbol">{letter}</sup>}
                    content={<span className="bookish-footnote" onMouseDown={handleMouseDown}><sup className="bookish-footnote-symbol">{letter}</sup> {renderNode(footnote)}</span>} 
                />
            </span>
        }
    />

}

export default Footnote