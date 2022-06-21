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
    const caret = useContext(CaretContext);

    const link = props.link;
    const url = link.getMeta();

    function saveEdit(value: string) {
        caret?.edit(link, link.withMeta(value));
    }

    function handleChapterChange(e: ChangeEvent<HTMLSelectElement>) {
        saveEdit(e.target.value);
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

    // Build the list of options (chapters and then any of the chapter's labels.)
    const options: { value: string, label: string}[] = [];
    chapter.book?.getChapters().map(chapter => {
        options.push({ value: chapter.getChapterID(), label: chapter.getTitle() });
        chapter.getAST()?.getLabels().map((label, index) => 
            options.push({ value: `${chapter.getChapterID()}:${label.getMeta()}`, label: chapter.getTitle() + ": " + label.getMeta()})
        )
    });

    return <span>
        <button title="Remove link."
            onClick={(e) => {
                if(caret?.context?.format) {
                    const newFormat = caret.context.format.withSegmentReplaced(link, link.getText());
                    if(newFormat)
                        caret.edit(caret.context.format, newFormat);
                }
            }}
        >
            <Unlink/>
        </button>
        <select name="chapterID" onChange={handleChapterChange} value={url}>
            <option value="">URL</option>
            { options.map((option, index) => <option key={index} value={option.value}>{option.label}</option>) }
        </select>
        <URLEditor url={url} valid={isValid(url)} edit={ url => { saveEdit(url); } } />
        {
            isValid(url) ?
                (
                    isValidURL(url) ? <span className="bookish-editor-note">This link will navigate to this URL.</span> :
                    url.indexOf(":") >= 0 ? <span className="bookish-editor-note">This link will navigate to this chapter label.</span> :
                    <span className="bookish-editor-note">This link will navigate to this chapter.</span>
                ) :
                <span className="bookish-editor-note bookish-editor-note-error">Choose a valid URL, chapter ID, or chapterID:labelID.</span>
        }
    </span>

}

export default LinkEditor;