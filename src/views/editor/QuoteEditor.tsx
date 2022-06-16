import React from 'react';
import { QuoteNode } from "../../models/QuoteNode"
import { Position } from '../../models/Position';
import PositionEditor from "./PositionEditor";

const QuoteEditor = (props: {
    quote: QuoteNode
}) => {

    const quote = props.quote;

    // TOOD Immutable: setPosition
    return <>
        <PositionEditor value={quote.getPosition()} edit={(position: string) => quote.withPosition(position as Position)} />
    </>

}

export default QuoteEditor;