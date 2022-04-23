import React from 'react';
import { QuoteNode } from "../../models/QuoteNode"
import { Position } from '../../models/Position';
import PositionEditor from "./PositionEditor";

const QuoteEditor = (props: {
    quote: QuoteNode
}) => {

    const callout = props.quote;

    return <>
        <PositionEditor value={callout.getPosition()} edit={(position: string) => callout.setPosition(position as Position)} />
    </>

}

export default QuoteEditor;