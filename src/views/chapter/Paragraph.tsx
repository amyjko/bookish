import { useContext } from 'react'
import { ParagraphNode } from "../../models/chapter/ParagraphNode"
import { EditorContext } from '../page/EditorContext'
import { ChapterContext } from './ChapterContext'
import Format from './Format'

const Paragraph = (props: { node: ParagraphNode, placeholder?: string }) => {

    const { node, placeholder } = props
    const content = node.getFormat();
    const level = node.getLevel();
    const context = useContext(ChapterContext)
    const chapter = context.chapter?.getAST();

    const id = node.getLevel() === 0 ? undefined : "header-" + (chapter ? chapter.getHeaders().indexOf(node) : "")
    const classes = node.getLevel() === 0 ? undefined: "bookish-header" + (context.highlightedID === id ? " bookish-content-highlight" : "")

    const format = <Format node={content}/>

    return  content === undefined ? <></> :
        level === 0 ? <p data-nodeid={props.node.nodeID}><Format node={props.node.getFormat()} placeholder={placeholder ?? "¶"}/></p> :
        level === 1 ? <h2 className={classes} id={id} data-nodeid={props.node.nodeID}>{format}</h2> :
        level === 2 ? <h3 className={classes} id={id} data-nodeid={props.node.nodeID}>{format}</h3> :
            <h4 className={classes} id={id} data-nodeid={props.node.nodeID}>{format}</h4>

}

export default Paragraph