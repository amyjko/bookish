import React, { ChangeEvent, useContext, useEffect, useRef, useState } from 'react'
import { CommentNode } from '../../models/CommentNode'
import Atom from '../editor/Atom';
import { EditorContext } from '../page/Book';
import { ChapterContext } from './Chapter';
import Marginal from './Marginal';

import CommentIcon from "../svg/comment.svg";
import { renderNode } from './Renderer';
import { CaretContext } from '../editor/ChapterEditor';

const Comment = (props: { node: CommentNode }) => {

    const comment = props.node;
    const { chapter } = useContext(ChapterContext);
    const { editable } = useContext(EditorContext);
    const context = useContext(ChapterContext);

    const caret = useContext(CaretContext);

    useEffect(() => {
        if(context && context.layoutMarginals) {
            context.layoutMarginals();
        }
    });

    const focused = caret && caret.range && chapter && caret.range.start.node.hasAncestor(chapter, comment);

    return <Atom
        node={comment}
        textView={
            editable ?
            <Marginal 
                id={"comment-" + chapter?.getComments().indexOf(comment)}
                interactor={<span className="bookish-comment-symbol"><CommentIcon/></span>}
                content={<span className={`bookish-app-comment ${focused ? "bookish-app-comment-focused" : ""}`}>{renderNode(comment.getMeta())}</span>}
            />
            :
            <></>
        }
    />;

}

export default Comment