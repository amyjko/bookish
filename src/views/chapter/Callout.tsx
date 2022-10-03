import { CalloutNode } from "../../models/chapter/CalloutNode"
import Block from "./Block";
import renderPosition from "./renderPosition";

const Callout = (props: { node: CalloutNode }) => {

    return <div className={"bookish-callout " + renderPosition(props.node.getPosition())} data-nodeid={props.node.nodeID}>
        { props.node.getBlocks().map((element, index) => <Block node={element} key={"callout-" + index}/>)}
    </div>

}

export default Callout