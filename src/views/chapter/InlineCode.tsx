import React, { ChangeEvent, useContext, useEffect, useRef, useState } from 'react'
import Code from './Code'
import { InlineCodeNode } from "../../models/InlineCodeNode"
import { CaretContext } from '../editor/ChapterEditor'
import { EditorContext } from '../page/Book'
import { renderNode } from './Renderer'
import Atom from '../editor/Atom'

const InlineCode = (props: { node: InlineCodeNode }) => {

    const { node } = props

    const caret = useContext(CaretContext);
    const { editable } = useContext(EditorContext);
    const selectRef = useRef<HTMLSelectElement>(null);
    const [ language, setLanguage ] = useState<string>(node.getMeta());

    // Is the caret on this code node?
    const selectFocused = caret && caret.selection && caret.selection.start.node === node;

    useEffect(() => {
        if(selectFocused && selectRef.current)
            selectRef.current.focus();
    }, [caret]);

    const languages = [ "C", "C++", "CSS", "Go", "HTML", "Java", "JavaScript", "Markdown", "Plaintext", "Python", "TypeScript" ];

    function handleChange(event: ChangeEvent<HTMLSelectElement>) {
        setLanguage(event.target.value);
        node.setMeta(event.target.value);
        if(caret && caret.setCaretRange)
            caret.setCaretRange({ start: { node: node.getText(), index: 0 }, end: { node: node.getText(), index: 0 }});
    }

    const editableView = <span className="bookish-code bookish-code-inline hljs" data-nodeid={node.nodeID}>{renderNode(node.getText())}</span>;
    const staticView = <Code editable={false} inline={true} language={node.getMeta()} nodeID={node.getText().nodeID}>{node.getMeta()}</Code>;

    return <Atom
        node={node}
        editingTextView={editableView}
        readingTextView={staticView}
        metaView={
            <select 
                ref={selectRef} 
                tabIndex={0} 
                value={language} 
                onChange={handleChange}
            >
                { languages.map((lang, index) => <option key={index} value={lang.toLowerCase()}>{lang}</option>)}
            </select>
        }
    />

}

export default InlineCode