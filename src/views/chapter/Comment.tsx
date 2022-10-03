import { useContext, useEffect } from 'react'
import { CommentNode } from '../../models/chapter/CommentNode'
import Atom from '../editor/Atom';
import { ChapterContext } from './ChapterContext';
import Marginal from './Marginal';

import CommentIcon from "../../assets/svg/comment.svg";
import Format from './Format';
import { EditorContext } from '../page/EditorContext';
import { CaretContext } from '../editor/CaretContext';

const Comment = (props: { node: CommentNode }) => {

    const comment = props.node;
    const { chapter } = useContext(ChapterContext);
    const { editable } = useContext(EditorContext);
    const context = useContext(ChapterContext);
    const chapterNode = chapter?.getAST();

    const caret = useContext(CaretContext);

    useEffect(() => {
        if(context && context.layoutMarginals) {
            context.layoutMarginals();
        }
    });

    const focused = caret && caret.range && chapter && comment.contains(caret.range.start.node);

    return <Atom
        node={comment}
        textView={
            editable ?
            <Marginal 
                id={"comment-" + (chapterNode === undefined ? "?" : chapterNode.getComments().indexOf(comment))}
                interactor={<span className="bookish-comment-symbol"><CommentIcon/></span>}
                content={<span className={`bookish-app-comment ${focused ? "bookish-app-comment-focused" : ""}`}><Format node={comment.getMeta()} placeholder="comment"/></span>}
            />
            :
            <></>
        }
    />;

}

export default Comment