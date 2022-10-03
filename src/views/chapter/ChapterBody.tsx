import { ChapterNode } from "../../models/chapter/ChapterNode"
import { ParagraphNode } from '../../models/chapter/ParagraphNode'
import Block from "./Block"
import Paragraph from './Paragraph'

const ChapterBody = (props: { node: ChapterNode, placeholder?: string }) => {

    const { node, placeholder } = props
    const errors = node.getErrors();
    const blocks = node.getBlocks();

    return <div className="bookish-chapter-body" data-nodeid={props.node.nodeID}>
        {
            errors.length === 0 ? 
                null : 
                <p>
                    <span className="bookish-error">{errors.length + " " + (errors.length > 1 ? "errors" : "error")} below</span>
                </p>
        }
        { 
            blocks.length === 1 && blocks[0] instanceof ParagraphNode && blocks[0].getFormat().isEmptyText() ?
                <Paragraph node={blocks[0]} placeholder={placeholder} /> :
                node.getBlocks().map((block, index) => <Block node={block} key={"block-" + index}/>) 
        }
    </div>

}

export default ChapterBody;