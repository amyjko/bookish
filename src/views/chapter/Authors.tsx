import React, { useContext } from 'react';
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

    function addAuthor() {

        if(book) props.add.call(undefined)

    }

    const showInherited = authors.length === 0 && inheritedAuthors;

    return <div className="bookish-authors">
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
                                save={text => props.edit.call(undefined, index, text)}
                            >
                                {renderNode(Parser.parseFormat(book, author))}
                            </TextEditor>
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
                <span className="bookish-editor-note">&nbsp;(inherited from book authors)&nbsp;</span> : 
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