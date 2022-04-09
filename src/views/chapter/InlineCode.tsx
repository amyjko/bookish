import React, { ChangeEvent, useContext, useEffect, useRef, useState } from 'react'
import Code from './Code'
import { InlineCodeNode } from "../../models/InlineCodeNode"
import { CaretContext } from '../editor/ChapterEditor'
import { renderNode } from './Renderer'
import Metadata from '../editor/Metadata'
import Options from '../editor/Options'

const InlineCode = (props: { node: InlineCodeNode }) => {

    const { node } = props

    const caret = useContext(CaretContext);
    const selectRef = useRef<HTMLSelectElement>(null);

    // Is the caret on this code node?
    const selectFocused = caret && caret.range && caret.range.start.node === node;

    useEffect(() => {
        if(selectFocused && selectRef.current)
            selectRef.current.focus();
    }, [caret]);

    const languages = [ "C", "C++", "CSS", "Go", "HTML", "Java", "JavaScript", "Markdown", "Plaintext", "Python", "TypeScript" ];

    function handleChange(values: string[]) {
        const newValue = values[0];
        node.setMeta(newValue);
    }

    const editableView = <span className="bookish-code bookish-code-inline hljs" data-nodeid={node.nodeID}>{renderNode(node.getText())}</span>;
    const staticView = <Code editable={false} inline={true} language={node.getMeta()} nodeID={node.getText().nodeID}>{node.getText().getText()}</Code>;

    return <Metadata
        node={node}
        editingTextView={editableView}
        readingTextView={staticView}
        metaView={
            <Options
                multiple={false}
                options={languages.map(lang => { return { value: lang.toLocaleLowerCase(), label: lang }})}
                values={[node.getMeta()]}
                change={handleChange}
            />
        }
    />

}

export default InlineCode