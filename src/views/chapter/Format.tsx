import { useContext } from "react";
import { FormatNode } from "../../models/chapter/FormatNode";
import { EditorContext } from "../page/EditorContext";
import Segment from "./Segment";

const Format = (props: { node: FormatNode, placeholder?: string }) => {

    const { node, placeholder } = props

    const { editable } = useContext(EditorContext)

    const segmentDOMs = node.getSegments().map(
        (segment, index) => 
            segment instanceof FormatNode ? 
                <Format key={"formatted-" + index} node={segment} /> : 
                <Segment node={segment} key={"formatted-" + index}/>
    );

    const format = node.getFormat();

    if(node.isEmptyText() && placeholder !== undefined && editable)
        return <span data-nodeid={props.node.nodeID} className="bookish-editor-placeholder">{segmentDOMs}{placeholder}</span>
    else if(format === "*")
        return <strong data-nodeid={props.node.nodeID}>{segmentDOMs}</strong>;
    else if(format === "_")
        return <em data-nodeid={props.node.nodeID}>{segmentDOMs}</em>;
    else if(format === "^")
        return <sup data-nodeid={props.node.nodeID}>{segmentDOMs}</sup>;
    else if(format === "v")
        return <sub data-nodeid={props.node.nodeID}>{segmentDOMs}</sub>
    else
        return <span data-nodeid={props.node.nodeID}>{segmentDOMs}</span>;

}

export default Format;