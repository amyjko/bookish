import React, { useContext, useEffect, useRef, useState } from 'react';
import Parser from '../../models/Parser';
import TextEditor from '../editor/TextEditor';
import { EditorContext } from '../page/Book';
import { renderNode } from './Renderer';

const Authors = (props: { 
    authors: string[], 
    inheritedAuthors?: string[],
    add: () => Promise<void>,
    edit: (index: number, text: string) => Promise<void> | undefined 
}) => {

    const { authors, inheritedAuthors } = props
    const { editable, book } = useContext(EditorContext)
    const ref = useRef<HTMLDivElement>(null);
    const [ newAuthor, setNewAuthor ] = useState<boolean>(false);

    useEffect(() => {
        if(ref.current && newAuthor) {
            const editors = ref.current.querySelectorAll(".bookish-text-editor input");
            if(editors.length > 0) {
                const lastAuthor = editors[editors.length - 1];
                if(lastAuthor instanceof HTMLElement)
                    lastAuthor.focus();
            }
            setNewAuthor(false);
        }
    }, [newAuthor])

    function addAuthor() {

        if(book) {
            props.add.call(undefined);
            setNewAuthor(true);
        }
    }

    const showInherited = authors.length === 0 && inheritedAuthors;

    return <div className="bookish-authors" ref={ref}>
        {
            authors.length === 0 && (inheritedAuthors === undefined || inheritedAuthors.length === 0)  ? 
                "No authors" : 
                <em>by </em> 
        }
        {
            (showInherited ? inheritedAuthors : authors).map( 
                (author, index) => [
                    book ?
                        editable && !showInherited ? 
                            <TextEditor
                                key={"author" + index}
                                text={author} 
                                label={'Author name editor'} 
                                placeholder="Author"
                                valid={ text => undefined }
                                save={ text => props.edit.call(undefined, index, text) }
                            />
                            :
                            <span key={"author" + index}>{renderNode(Parser.parseFormat(book, author))}</span>
                        : <span key={"author" + index}>{author}</span>
                    ,
                    index < authors.length - 1 ? (", ") : null
                ]
            )
        }
        {
            editable && showInherited ?
                <span className="bookish-editor-note">&nbsp;(book authors)&nbsp;</span> : 
                null
        }
        &nbsp;
        {
            editable ?
                <button onClick={addAuthor}>+</button>
                :
                null
        }
    </div>
}

export default Authors