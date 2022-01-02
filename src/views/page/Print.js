import React from 'react'
import Chapter from "../chapter/Chapter"

export default function Print(props) {

    return <>
        {
            // Render all of the chapters
            props.book.getChapters().filter(chapter => !chapter.isForthcoming()).map(
                (chapter, index) => <Chapter key={index} book={props.book} chapter={chapter} print />
            )
        }
    </>

}