import { useContext } from 'react'
import { ChapterContext } from './ChapterContext'
import { LabelNode } from "../../models/chapter/LabelNode"
import Atom from '../editor/Atom';
import { EditorContext } from '../page/EditorContext';

const Label = (props: { node: LabelNode }) => {

    const { node } = props;
    const context = useContext(ChapterContext);
    const { editable } = useContext(EditorContext)

    const ast = context.chapter?.getAST();
    const duplicate = 
        ast === undefined ? 
        false : 
        ast.getLabels().filter(l => l.getMeta() === node.getMeta()).length > 1;


    const label = <span 
        className={"bookish-label" + (context.highlightedID === node.getMeta() ? " bookish-content-highlight" : "")} 
        id={node.getMeta()}
        data-nodeid={props.node.nodeID}
    >
        {editable ? <span className={`${duplicate ? "bookish-error" : ""}`}>•<code>{node.getMeta()}</code></span> : ""}
    </span>

    return <Atom
        node={node}
        textView={label}
    />;
}

export default Label;