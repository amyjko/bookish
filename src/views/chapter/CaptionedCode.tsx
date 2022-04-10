import React, { useContext, useEffect, useRef } from 'react'
import { renderNode, renderPosition } from './Renderer'
import Code from './Code'
import Python from './Python'
import { CodeNode } from "../../models/CodeNode"
import { EditorContext } from '../page/Book'
import { CaretContext } from '../editor/ChapterEditor'
import Switch from '../editor/Switch'
import { Position } from "../../models/Position"
import Options from '../editor/Options'
import PositionEditor from '../editor/PositionEditor'

const CaptionedCode = (props: { node: CodeNode}) => {

    const { node } = props;
    
    const caption = node.getCaption();
    const position = node.getPosition();
    const language = node.getLanguage();
    const executable = node.isExecutable();

    const { editable } = useContext(EditorContext);
    const caret = useContext(CaretContext);

    const codeRef = useRef(null);

    const languages = [ "C", "C++", "CSS", "Go", "HTML", "Java", "JavaScript", "Markdown", "Plaintext", "Python", "TypeScript" ];

    const editing = editable && caret && caret.range && caret.range.start.node.getClosestParentMatching(p => p === node);
    
    return <div className={"bookish-figure " + renderPosition(node.getPosition())} data-nodeid={props.node.nodeID}>
        {
            editable ?
            <code 
                className={`bookish-code bookish-code-block language-${language}`}
                ref={codeRef}
            >
                {renderNode(node.getCodeNode())}
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
                <div className="bookish-figure-caption">{renderNode(caption)}</div>
                : 
                null
        }
        { editing ?
            <>
                <PositionEditor
                    value={position}
                    edit={(value: string) => { 
                        node.setPosition(value as Position); 
                        // Force an update since the caret position changed.
                        if(caret.range) 
                            caret.setCaretRange({ start: caret.range.start, end: caret.range.end })} 
                    } 
                />
                <Options
                    multiple={false}
                    options={languages.map(lang => { return { value: lang.toLocaleLowerCase(), label: lang }})}
                    values={[language]}
                    change={(values: string[]) => node.setLanguage(values[0])}
                />
                { language !== "python" ? null : 
                    <Switch
                        options={["executable", "read only"]}
                        value={executable ? "executable" : "read only"}
                        position=">"
                        edit={(value: string) => node.setExecutable(value === "executable")}
                    />
                }
            </>
             :
             null
        }        

    </div>

}

export default CaptionedCode