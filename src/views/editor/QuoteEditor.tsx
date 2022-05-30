import React from 'react';
import { QuoteNode } from "../../models/QuoteNode"
import { Position } from '../../models/Position';
import PositionEditor from "./PositionEditor";

const QuoteEditor = (props: {
    quote: QuoteNode
}) => {

    const quote = props.quote;

    return <>
        <PositionEditor value={quote.getPosition()} edit={(position: string) => quote.setPosition(position as Position)} />
    </>

}

export default QuoteEditor;