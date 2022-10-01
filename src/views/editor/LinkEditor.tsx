import React, { ChangeEvent, useContext, useState } from "react";
import { LinkNode } from "../../models/chapter/LinkNode";
import { ChapterContext } from "../chapter/Chapter";
import URLEditor from "./URLEditor";

import Unlink from "../svg/unlink.svg";
import { CaretContext } from "./BookishEditor";

const LinkEditor = (props: {
    link: LinkNode
}) => {

    const chapter = useContext(ChapterContext);
    const caret = useContext(CaretContext);
    const [ selectedOption, setSelectedOption ] = useState<string>("");

    const link = props.link;
    const url = link.getMeta();

    function saveEdit(value: string) {
        caret?.edit(link, link.withMeta(value));
    }

    function handleChapterChange(e: ChangeEvent<HTMLSelectElement>) {
        saveEdit(e.target.value);
        setSelectedOption(e.target.value);
    }

    function isValidURL(url: string) {
        // Is it a valid URL?
        try {
            let test = new URL(url);
            if(test.protocol === "http:" || test.protocol === "https:")
                return true;
        } catch (_) {}
        return false;
    }

    function getURLError(urlOrChapter: string): string | undefined {

        if(urlOrChapter.length === 0) 
            return "Can't be empty.";

        if(isValidURL(urlOrChapter))
            return;

        if(!chapter || !chapter.book)
            return;

        // If not, is it a valid chapterID?
        if(chapter.book.hasChapter(urlOrChapter))
            return;

        // If not, is it a valid chapterID:label?
        const [ chapterID, labelID ] = urlOrChapter.split(":");
        if(chapterID === undefined || labelID === undefined)
            return;

        // The chapter ID is optional; if it's missing, it refers to this chapter.
        const correspondingChapter = chapterID === "" ? chapter.chapter?.getAST() : chapter.book.getChapter(chapterID)?.getAST();
        if(correspondingChapter === undefined)
            return "Not a valid URL or chapter.";
        
        if(!correspondingChapter.hasLabel(labelID))
            return "Not a valid chapter label."

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
        <code>
            <URLEditor key={selectedOption} url={url} validator={getURLError} edit={ url => { saveEdit(url); return undefined; }} />
        </code>
    </span>

}

export default LinkEditor;