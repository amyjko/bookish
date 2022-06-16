import React from 'react'
import { ListNode } from "../../models/ListNode"
import { renderNode } from './Renderer'

const List = (props: { node: ListNode}) => {

    const items = props.node.getItems().map((item, index) =>
        item.getType() === "list" ?
            renderNode(item, "item-" + index) :
            <li key={"item-" + index}>{renderNode(item)}</li>
    );

    return props.node.isNumbered() ?
        <ol data-nodeid={props.node.nodeID}>{items}</ol>
        :
        <ul data-nodeid={props.node.nodeID}>{items}</ul>;
    
}

export default List