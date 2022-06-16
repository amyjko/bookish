import React from 'react';
import { CalloutNode } from "../../models/CalloutNode"
import { Position } from '../../models/Position';
import PositionEditor from "./PositionEditor";

const CalloutEditor = (props: {
    callout: CalloutNode
}) => {

    const callout = props.callout;

    // TODO Immutable
    return <>
        <PositionEditor value={callout.getPosition()} edit={(position: string) => callout.withPosition(position as Position)} />
    </>

}

export default CalloutEditor;