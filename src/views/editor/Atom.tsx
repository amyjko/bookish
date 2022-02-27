import React, { ReactNode, useContext } from 'react'

import { EditorContext } from '../page/Book';
import { CaretContext } from './ChapterEditor';
import { MetadataNode } from '../../models/MetadataNode';

const Atom = (props: { node: MetadataNode<any>, editingTextView: React.ReactElement, readingTextView: React.ReactElement, metaView: React.ReactElement}) => {

    const { node, editingTextView, readingTextView, metaView } = props;
    const caret = useContext(CaretContext);
    const { editable } = useContext(EditorContext)

    // Is the caret on this link?
    const textFocused = caret && caret.selection && caret.selection.start.node === node.getText();
    const metaFocused = caret && caret.selection && caret.selection.start.node === node;
    
    function handleKeyDown(event: React.KeyboardEvent) {
        
        if(caret === undefined)
            return;

        // If up, then go back to the link's text node.
        if(event.key === "ArrowUp" || event.key === "Enter") {
            caret.setCaretRange({ start: { node: node.getText(), index: 0 }, end: { node: node.getText(), index: 0 }});
        }

    }

    function handleMouseDown(event: React.MouseEvent) {

        // Select this node
        if(caret === undefined)
            return;

        // Select this so that the view stays focused.
        caret.setCaretRange({ start: { node: node, index: 0 }, end: { node: node, index: 0 }});

    }

    return editable ?
        (
            textFocused || metaFocused ?
                <>
                    <span className="bookish-editor-inline-editor">
                        <span 
                            className="bookish-editor-inline-form" 
                            onKeyDown={handleKeyDown}
                            onMouseDown={handleMouseDown}
                        >
                            { metaView }
                        </span>
                    </span>
                    { editingTextView }
                </> 
            : 
            editingTextView
        ) 
        :
        readingTextView;
    
}

export default Atom;