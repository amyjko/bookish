import React, { useContext } from 'react';
import { CalloutNode } from "../../models/CalloutNode"
import { Position } from '../../models/Position';
import { CaretContext, CaretContextType } from './ChapterEditor';
import PositionEditor from "./PositionEditor";

const CalloutEditor = (props: {
    callout: CalloutNode
}) => {

    const callout = props.callout;
    const caret = useContext<CaretContextType>(CaretContext);

    return <>
        <PositionEditor 
            value={callout.getPosition()} 
            edit={(position: string) => caret?.edit(callout, callout.withPosition(position as Position))}
        />
    </>

}

export default CalloutEditor;