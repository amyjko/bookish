import React from 'react'
import Edition from '../../models/book/Edition'
import Chapter from "../chapter/Chapter"

const Print = (props: { book: Edition }) => {

    return <>
        {
            // Render all of the chapters
            props.book.getChapters().filter(chapter => !chapter.isForthcoming()).map(
                (chapter, index) => <Chapter key={index} book={props.book} chapter={chapter} print />
            )
        }
    </>

}

export default Print