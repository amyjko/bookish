import React, { ChangeEvent, useContext, useState } from "react";
import { LinkNode } from "../../models/LinkNode";
import { ChapterContext } from "../chapter/Chapter";
import URLEditor from "./URLEditor";

import Unlink from "../svg/unlink.svg";
import { CaretContext } from "./ChapterEditor";

const LinkEditor = (props: {
    link: LinkNode
}) => {

    const chapter = useContext(ChapterContext);
    const link = props.link;
    const [ editedURL, setEditedURL ] = useState<string>(link.getMeta());
    const caret = useContext(CaretContext);

    function handleChapterChange(e: ChangeEvent<HTMLSelectElement>) {

        setEditedURL(e.target.value);
        link.setMeta(e.target.value);

    }

    function isValidURL(url: string) {
        // Is it a valid URL?
        try {
            let test = new URL(url);
            if(test.protocol === "http:" || test.protocol === "https:")
                return true;
        } catch (_) {}
    }

    function isValid(urlOrChapter: string) {

        if(isValidURL(urlOrChapter))
            return true;

        if(!chapter || !chapter.book)
            return false;

        // If not, is it a valid chapterID?
        if(chapter.book.hasChapter(urlOrChapter))
            return true;

        // If not, is it a valid chapterID:label?
        const [ chapterID, labelID ] = urlOrChapter.split(":");
        if(chapterID === undefined || labelID === undefined)
            return false;
        // The chapter ID is optional; if it's missing, it refers to this chapter.
        const correspondingChapter = chapterID === "" ? chapter.chapter : chapter.book.getChapter(chapterID)?.getAST();
        if(!correspondingChapter)
            return false;
        return correspondingChapter.hasLabel(labelID);

    }

    return <span>
        <button title="Remove link."
            onClick={(e) => {
                if(chapter && chapter.chapter && caret && caret.range) {
                    const newCaret = chapter.chapter.toggleAtom(caret.range, LinkNode, (parent, text) => new LinkNode(parent, text));
                    caret.setCaretRange({ start: newCaret, end: newCaret });
                }
            }}
        >
            <Unlink/>
        </button>
        <select name="chapterID" onChange={handleChapterChange} value={editedURL}>
            <option key="url" value="">URL</option>
            {/* Convert each chapter into a chapter link and a link for all the chapter's labels */}
            { 
                chapter.book?.getChapters().map(chapter => <>
                    <option key={chapter.getChapterID()} value={chapter.getChapterID()}>{chapter.getTitle()}</option>
                    {
                        chapter.getAST()?.getLabels().map(label => 
                            <option key={chapter.getChapterID() + label.getMeta()} value={`${chapter.getChapterID()}:${label.getMeta()}`}>{chapter.getTitle() + ": " + label.getMeta()}</option>
                        )
                    }
                </>)
            }
        </select>
        <URLEditor url={editedURL} valid={isValid(editedURL)} edit={ url => { setEditedURL(url); link.setMeta(url); } } />
        {
            isValid(editedURL) ?
                (
                    isValidURL(editedURL) ? <span className="bookish-editor-note">This link will navigate to this URL.</span> :
                    editedURL.indexOf(":") >= 0 ? <span className="bookish-editor-note">This link will navigate to this chapter label.</span> :
                    <span className="bookish-editor-note">This link will navigate to this chapter.</span>
                ) :
                <span className="bookish-editor-note bookish-editor-note-error">Choose a valid URL, chapter ID, or chapterID:labelID.</span>
        }
    </span>

}

export default LinkEditor;