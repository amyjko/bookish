import React, { useContext } from 'react';
import Parser from '../../models/Parser';
import TextEditor from '../editor/TextEditor';
import { EditorContext } from '../page/Book';
import { renderNode } from './Renderer';

const Authors = (
    props: { authors: string[], 
    add: () => Promise<void>,
    edit: (index: number, text: string) => Promise<void> }
) => {

    const { authors } = props
    const { editable, setEditingBook, book } = useContext(EditorContext)

    function addAuthor() {

        if(setEditingBook) {
            setEditingBook(true);
            if(book) props.add.call(undefined).finally(() => setEditingBook(false))
        }

    }

    return <div className="bookish-authors">
        {
            authors.length === 0 ? 
                "No authors" : 
                <em>by </em> 
        }
        {
            authors.map( 
                (author, index) => [
                    book ?
                        editable ? 
                            <TextEditor
                                key={"author" + index}
                                text={author} 
                                label={'Author name editor'} 
                                save={text => props.edit.call(undefined, index, text)}
                            >
                                {renderNode(Parser.parseContent(book, author))}
                            </TextEditor>
                            :
                            <span key={"author" + index}>{renderNode(Parser.parseContent(book, author))}</span>
                        : <span key={"author" + index}>{author}</span>
                    ,
                    index < authors.length - 1 ? (", ") : null
                ]
            )
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