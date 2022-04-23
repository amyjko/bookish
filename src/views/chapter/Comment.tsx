import React, { ChangeEvent, useContext, useEffect, useRef, useState } from 'react'
import { CommentNode } from '../../models/CommentNode'
import Atom from '../editor/Atom';
import { EditorContext } from '../page/Book';
import { ChapterContext } from './Chapter';
import Marginal from './Marginal';

const Comment = (props: { node: CommentNode }) => {

    const comment = props.node;
    const { chapter } = useContext(ChapterContext);
    const { editable } = useContext(EditorContext);
    const [ editing, setEditing ] = useState(false);
    const [ editedComment, setEditedComment ] = useState(comment.getMeta());
    const ref = useRef<HTMLInputElement>(null);

    function edit() {
        setEditing(true);
    }

    useEffect(() => {
        if(ref && ref.current)
            ref.current.focus();
    }, [editing]);

    function handleChange(event: ChangeEvent<HTMLInputElement>) {

        setEditedComment(event.target.value);
        comment.setMeta(event.target.value);

    }

    const commentEditor = editing ?
        <input 
            className="bookish-app-comment-editor" 
            type="text" 
            value={editedComment} 
            onChange={handleChange} 
            onBlur={() => setEditing(false) }
            ref={ref}
        /> :
        <span className="bookish-app-comment" onMouseDown={edit}>{comment.getMeta()}</span>

    return <Atom
        node={comment}
        textView={
            editable ?
            <Marginal 
                id={"comment-" + chapter?.getComments().indexOf(comment)}
                interactor={<span className="bookish-comment-symbol">•</span>}
                content={commentEditor}
            />
            :
            <></>
        }
    />;

}

export default Comment