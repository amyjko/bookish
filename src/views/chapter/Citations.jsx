import React, { useContext } from 'react'
import Marginal  from './Marginal'
import Parser from '../../models/Parser'
import { renderNode } from './Renderer'
import { ChapterContext } from './Chapter'

function Citations(props) {

    const { node } = props

    const context = useContext(ChapterContext)

    let segments = [];

    // If there's no context or chapter, then render nothing.
    if(!context || !context.chapter)
        return null;

    const chapter = context.chapter
    const book = context.book

    // Sort citations numerically, however they're numbered.
    let citations = node.citations.sort((a, b) => {
        let aNumber = chapter.getCitationNumber(a);
        let bNumber = chapter.getCitationNumber(b);
        if(aNumber === null && bNumber === null) return 0;
        else if(aNumber === null && bNumber !== null) return 1;
        else if(aNumber !== null && bNumber === null) return -1;
        else return aNumber - bNumber;
    });

    // Convert each citation ID until a link.
    citations.forEach(
        (citationID, index) => {
            // Find the citation number. There should always be one,
            let citationNumber = chapter.getCitationNumber(citationID)
            if(citationNumber !== null && citationID in book.getReferences()) {
                // Add a citation.
                segments.push(
                    <sup key={index} className="bookish-citation-symbol">{citationNumber}</sup>
                );
            }
            // If it's not a valid citation number, add an error.
            else {
                segments.push(<span className="bookish-error" key={"citation-error-" + index}>Unknown reference: <code>{citationID}</code></span>)
            }

            // If there's more than one citation and this isn't the last, add a comma.
            if(citations.length > 1 && index < citations.length - 1)
                segments.push(<sup key={"citation-comma-" + index}>,</sup>);
        }
    );
    
    return <span className="bookish-citation">
        <Marginal
            id={"citation-" + citations.join("-")}
            interactor={segments}
            content={
                <span className="bookish-references">
                    {
                        citations.map((citationID, index) => {
                            let citationNumber = chapter.getCitationNumber(citationID);
                            return book.getReferences(citationID) ?
                                <span 
                                    key={index} 
                                    className="bookish-reference">
                                        <sup className="bookish-citation-symbol">{citationNumber}</sup>
                                        { renderNode(Parser.parseReference(book.getReferences()[citationID], context.book, true)) }
                                </span> :
                                null
                        })
                }
                </span>
            }
        />
    </span>

}

export default Citations