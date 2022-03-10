import React, { ChangeEvent, useContext } from 'react'
import { ChapterContext } from './Chapter'
import { LabelNode } from "../../models/LabelNode"
import Atom from '../editor/Atom';
import { EditorContext } from '../page/Book';

const Label = (props: { node: LabelNode }) => {

    const { node } = props;
    const context = useContext(ChapterContext);
    const { editable } = useContext(EditorContext)

    const label = <span 
        className={"bookish-label" + (context.highlightedID === node.getMeta() ? " bookish-content-highlight" : "")} 
        id={node.getMeta()}
        data-nodeid={props.node.nodeID}
    >
        {editable ? "•" : ""}
    </span>

    function handleChange(e: ChangeEvent<HTMLInputElement>) {

        // Update the model
        node.setMeta(e.target.value);

    }

    function isValid() { 

        // At least one character and only appears once.
        return node.getMeta().length > 0 && context.chapter && context.chapter.getLabels().filter(label => label.getMeta() === node.getMeta()).length === 1;

    }

    return <Atom
        node={node}
        textView={label}
        metaView={
            <input 
                type="text"
                className={isValid() ? "" : "bookish-editor-link-invalid"}
                value={node.getMeta()}
                onChange={handleChange}
                placeholder="label ID"
            />
        }
    />;
}

export default Label;