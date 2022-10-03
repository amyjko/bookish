import React, { useContext, useEffect } from 'react'
import { ChapterContext } from './ChapterContext'
import Marginal  from './Marginal'
import { FootnoteNode } from "../../models/chapter/FootnoteNode"
import Atom from '../editor/Atom'
import Format from './Format'
import { CaretContext } from '../editor/CaretContext'

const Footnote = (props: { node: FootnoteNode }) => {

    const { node: footnote } = props
    const content = footnote.getMeta();
    const context = useContext(ChapterContext);
    const caret = useContext(CaretContext);
    const chapter = context.chapter?.getAST();

    // If no chapter was provided, then don't render the footnote, since there's no context in which to render it.
    if(chapter === undefined || !context.book)
        return <></>;

    // What footnote number is this?
    let number = chapter.getFootnotes().indexOf(footnote);
    let letter = context.book.getFootnoteSymbol(number);

    const focused = caret && caret.range && caret.range.start.node.hasAncestor(chapter, footnote);

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
        node={footnote}
        textView={
            <span className={`bookish-footnote-link`} data-nodeid={props.node.nodeID}>
                <Marginal 
                    id={"footnote-" + number}
                    interactor={<sup className="bookish-footnote-symbol">{letter}</sup>}
                    content={<span className={`bookish-footnote ${focused ? "bookish-footnote-focused" : ""}`} onMouseDown={handleMouseDown}><sup className="bookish-footnote-symbol">{letter}</sup><Format node={content} placeholder="footnote"/></span>} 
                />
            </span>
        }
    />

}

export default Footnote