import React, { useContext, useRef } from 'react'
import { TextNode } from "../../models/TextNode";
import { CaretContext } from '../editor/ChapterEditor';
import { ChapterContext } from './Chapter';

function replaceMultipleSpacesWithNonBreakingSpaces(original: string) {

    let text = ""
    for(let i = 0; i < original.length; i++) {
        // If its a space and its at the beginning, the end, or the previous character was a space, make it a non-breaking space.
        let c = original.charAt(i)
        if(c === " " && (i === 0 || i === original.length - 1 || original.charAt(i - 1) === " "))
            text += "\u00a0";
        else text += c
    }

    return text;

}

const Text = (props: { node: TextNode}) => {

    const { node } = props;

    const position = node.getPosition();
    let text = node.getText();
    
    const context = useContext(ChapterContext);
    const caret = useContext(CaretContext);
    const ref = useRef<HTMLSpanElement | null>(null);

    // Replace any spaces at the beginning or end of the string with explicit non-breaking spaces to ensure that they render.
    text = replaceMultipleSpacesWithNonBreakingSpaces(text)

    // Is there a query we're supposed to highlight? If so, highlight it.
    if(context && context.highlightedWord) {
        const query = context.highlightedWord;
        const lowerText = text.toLowerCase();
        // Does this text contain the query? Highlight it.
        if(lowerText.indexOf(query) >= 0) {

            // Find all the matches
            const indices = [];
            for(let i = 0; i < text.length; ++i) {
                if (lowerText.substring(i, i + query.length) === query) {
                    indices.push(i);
                }
            }

            // Go through each one and construct contents for the span to return.
            const segments = [];
            for(let i = 0; i < indices.length; i++) {
                // Push the text from the end of the last match or the start of the string.
                segments.push(text.substring(i === 0 ? 0 : indices[i - 1] + query.length, indices[i]));
                segments.push(<span key={"match-" + i} className="bookish-text bookish-content-highlight">{text.substring(indices[i], indices[i] + query.length)}</span>);
            }
            if(indices[indices.length - 1] < text.length - 1)
                segments.push(text.substring(indices[indices.length - 1] + query.length, text.length));

            return <span>{segments}</span>;

        }
        else return <span>{text}</span>;

    }

    // Otherwise, just return the text as a span with metadata.
    return <span ref={ref} className={"bookish-text"} data-position={position} data-nodeid={props.node.nodeID}>{text}</span>;

}

export default Text;