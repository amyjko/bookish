import { useContext, useRef } from 'react'
import Code from './Code'
import Python from './Python'
import { CodeNode } from "../../models/chapter/CodeNode"
import Format from './Format'
import Text from './Text'
import { EditorContext } from '../page/EditorContext'
import renderPosition from './renderPosition'

const CaptionedCode = (props: { node: CodeNode}) => {

    const { node } = props;
    
    const caption = node.getCaption();
    const language = node.getLanguage();

    const { editable } = useContext(EditorContext);

    const codeRef = useRef(null);

    // const languages = [ "C", "C++", "CSS", "Go", "HTML", "Java", "JavaScript", "Markdown", "Plaintext", "Python", "TypeScript" ];

    return <div className={"bookish-figure " + renderPosition(node.getPosition())} data-nodeid={props.node.nodeID}>
        {
            editable ?
            <code 
                className={`bookish-code bookish-code-block language-${language}`}
                ref={codeRef}
            >
                <Text node={node.getCodeNode()}/>
            </code>
            :
                node.getLanguage() === "python" && node.isExecutable() ? 
                    <Python node={node} code={node.getCode()}></Python> :
                    <div>
                        <Code editable={false} inline={false} language={node.getLanguage()} nodeID={node.getCodeNode().nodeID}>{node.getCode()}</Code>
                        { node.getLanguage() !== "plaintext" ? <div className="bookish-code-language">{node.getLanguage()}</div> : null }
                    </div>
        }
        {
            caption ? 
                <div className="bookish-figure-caption"><Format node={caption} placeholder="caption"/></div>
                : 
                null
        }

    </div>

}

export default CaptionedCode