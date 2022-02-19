import React, { useContext } from 'react'
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
    const context = useContext(ChapterContext);
    const caret = useContext(CaretContext);
    const position = node.getPosition();
    let text = node.getText();
    
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

    if(caret && caret.start.node instanceof TextNode && caret.end.node instanceof TextNode) {
        const textIndex = node.getChapter()?.getIndexOfTextNode(node);
        const startIndex = node.getChapter()?.getIndexOfTextNode(caret.start.node);
        const endIndex = node.getChapter()?.getIndexOfTextNode(caret.end.node);
        const insideSelection = textIndex !== undefined && startIndex !== undefined && endIndex !== undefined && Math.min(startIndex, endIndex) < textIndex && Math.max(startIndex, endIndex) > textIndex;

        if(insideSelection)
            return <span className="bookish-caret-selection">{text}</span>

        // Is this node between a selection?
        // If this node contains the caret or a selection, render it.
        if(caret.start.node === node || caret.end.node === node) {
        
            const startNodeIndex = node.getChapter()?.getIndexOfTextNode(caret.start.node as TextNode);
            const endNodeIndex = node.getChapter()?.getIndexOfTextNode(caret.end.node as TextNode);
            let start = startNodeIndex !== undefined && endNodeIndex !== undefined && startNodeIndex > endNodeIndex ? caret.end : caret.start;
            // Put the start and end in order, as they might be in reverse.
            let end = start === caret.start ? caret.end : caret.start;
            if(start.node === end.node && start.index > end.index) {
                let temp = start; start = end; end = temp;
            }

            return <span className={"bookish-text bookish-caret-container"} data-position={node.getPosition()} data-nodeid={props.node.nodeID}>
                {
                    // If the start and end node are the same...
                    start.node === end.node ? (
                        // And the index is the same...
                        start.index === end.index ?
                            // Render a caret.
                            <>
                                <span>{text.substring(0, start.index)}</span>
                                <span className="bookish-caret"></span>
                                <span>{text.substring(start.index)}</span>
                            </> :
                            // Otherwise, render a selection, ordering indices in case they're out of order.
                            <>
                                <span>{text.substring(0, start.index)}</span>
                                <span className="bookish-caret-selection">{text.substring(start.index, end.index)}</span>
                                <span>{text.substring(end.index)}</span>
                            </>
                    ) :
                    // If they are different nodes, and this is the start node, render the end of this as highlighted
                    start.node === node ?
                    <>
                        <span>{text.substring(0, start.index)}</span>
                        <span className="bookish-caret-selection">{text.substring(start.index)}</span>
                    </> :
                    // If this is the end of the selection, render the end of this as highlighted.
                    <>
                        <span className="bookish-caret-selection">{text.substring(0, end.index)}</span>
                        <span>{text.substring(end.index)}</span>
                    </>
                }
            </span>;

        }

    }

    // Otherwise, just return the text as a span with metadata.
    return <span className={"bookish-text"} data-position={position} data-nodeid={props.node.nodeID}>{text}</span>;

}

export default Text;