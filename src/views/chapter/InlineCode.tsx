import React, { ChangeEvent, useContext, useEffect, useRef, useState } from 'react'
import Code from './Code'
import { InlineCodeNode } from "../../models/InlineCodeNode"
import { CaretContext } from '../editor/ChapterEditor'
import { EditorContext } from '../page/Book'
import { renderNode } from './Renderer'

const InlineCode = (props: { node: InlineCodeNode }) => {

    const { node } = props

    const caret = useContext(CaretContext);
    const { editable } = useContext(EditorContext);
    const selectRef = useRef<HTMLSelectElement>(null);
    const [ language, setLanguage ] = useState<string>(node.getLanguage());

    // Is the caret on this code node?
    const textFocused = caret && caret.selection && caret.selection.start.node === node.getTextNode();
    const selectFocused = caret && caret.selection && caret.selection.start.node === node;

    useEffect(() => {

        if(selectFocused && selectRef.current)
            selectRef.current.focus();

    }, [caret]);

    const languages = [ "C", "C++", "CSS", "Go", "HTML", "Java", "JavaScript", "Markdown", "Plaintext", "Python", "TypeScript" ];

    function handleChange(event: ChangeEvent<HTMLSelectElement>) {
        setLanguage(event.target.value);
        node.setLanguage(event.target.value);
        if(caret && caret.setCaretRange)
            caret.setCaretRange({ start: { node: node.getTextNode(), index: 0 }, end: { node: node.getTextNode(), index: 0 }});
    }

    function handleMouseDown(event: React.MouseEvent) {

        // Select this node
        if(caret === undefined)
            return;

        // Select this so that the view stays focused.
        if(selectRef.current !== document.activeElement)
            caret.setCaretRange({ start: { node: node, index: 0 }, end: { node: node, index: 0 }});

    }

    const editableView = <span className="bookish-code bookish-code-inline hljs" data-nodeid={node.nodeID}>{renderNode(node.getTextNode())}</span>;
    const staticView = <Code editable={false} inline={true} language={node.getLanguage()} nodeID={node.getTextNode().nodeID}>{node.getCode()}</Code>;

    return editable ?
        textFocused || selectFocused ?
            <span className="bookish-editor-inline-editor">
                { editableView }
                <select 
                    ref={selectRef} 
                    tabIndex={0} 
                    className="bookish-editor-inline-form" 
                    value={language} 
                    onChange={handleChange}
                    onMouseDown={handleMouseDown}
                >
                    { languages.map((lang, index) => <option key={index} value={lang.toLowerCase()}>{lang}</option>)}
                </select>
            </span>
        :
        editableView
        : 
        staticView;

}

export default InlineCode