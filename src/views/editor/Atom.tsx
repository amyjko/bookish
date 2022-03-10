import React, { ReactNode, useContext } from 'react'

import { CaretContext } from './ChapterEditor';
import { AtomNode } from '../../models/AtomNode';

const Atom = (props: { node: AtomNode<any>, textView: React.ReactElement, metaView?: React.ReactElement}) => {

    const { node, textView, metaView } = props;
    const caret = useContext(CaretContext);

    // Is the caret on this link?
    const selected = caret && caret.range && caret.range.start.node === node;
    
    function handleMouseDown(event: React.MouseEvent) {

        // Select this node
        if(caret === undefined)
            return;

        // Select this so that the view stays focused.
        caret.setCaretRange({ start: { node: node, index: 0 }, end: { node: node, index: 0 }});

        // Prevent the editor from receiving the click.
        event.stopPropagation();

    }

    function handleKeyDown(event: React.KeyboardEvent) {
        
        if(caret === undefined)
            return;

        // If up, then go back to the link's text node.
        // if(event.key === "ArrowUp" || event.key === "Enter") {
        //     caret.setCaretRange({ start: { node: node.getText(), index: 0 }, end: { node: node.getText(), index: 0 }});
        // }

    }

    return selected ?
        <span 
            className={`bookish-editor-atom ${selected ? "bookish-editor-atom-selected" : ""}`} 
            onMouseDown={handleMouseDown}
        >
            { !metaView ? null : 
                <span className="bookish-editor-inline-editor">
                    <span 
                        className="bookish-editor-inline-form" 
                    >
                        { metaView }
                    </span>
                </span>
            }
            { textView }
        </span>
        :
        textView;
    
}

export default Atom;