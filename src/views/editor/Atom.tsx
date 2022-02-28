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

    }

    return caret ?
        <span 
            className={`bookish-editor-atom ${selected ? "bookish-editor-atom-highlight" : ""}`} 
            onMouseDown={handleMouseDown}
        >
            { textView }
            { metaView }
        </span>
        :
        textView;
    
}

export default Atom;