import { QuoteNode } from "../../models/chapter/QuoteNode"
import Block from "./Block";
import Format from './Format';
import renderPosition from "./renderPosition";

const Quote = (props: { node: QuoteNode}) => {

    const { node } = props;
    const credit = node.getCredit();
    const position = node.getPosition();

    return <blockquote className={"bookish-blockquote " + renderPosition(position)} data-nodeid={props.node.nodeID}>
        { node.getBlocks().map((element, index) => <Block node={element} key={"quote-" + index}/>) }
        { credit ? <div className="bookish-blockquote-caption"><span><Format node={credit} placeholder="credit"/></span></div> : null }
    </blockquote>

}

export default Quote;