import { FormatNode } from "../../models/chapter/FormatNode";
import { ListNode, ListNodeType } from "../../models/chapter/ListNode"
import Format from "./Format";

function renderItem(item: ListNodeType, key?: string) {
    return item instanceof FormatNode ? <Format node={item} key={key}/> : <List node={item} key={key}/>
}

const List = (props: { node: ListNode}) => {

    const items = props.node.getItems().map((item, index) =>
        item.getType() === "list" ?
            renderItem(item, "item-" + index) :
            <li key={"item-" + index}>{renderItem(item)}</li>
    );

    return props.node.isNumbered() ?
        <ol data-nodeid={props.node.nodeID}>{items}</ol>
        :
        <ul data-nodeid={props.node.nodeID}>{items}</ul>;
    
}

export default List