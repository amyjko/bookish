import React from "react";
import { Node } from "../../models/chapter/Node";

const Placeholder = (props: { text: string, node: Node }) => {

    return <div className="bookish-editor-placeholder bookish-text" data-nodeid={props.node.getID()}>
        {props.text}
    </div>
}

export default Placeholder;