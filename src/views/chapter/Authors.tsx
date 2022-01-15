import React from 'react';
import { Author } from '../../models/Book';

const Authors = (props: { authors: Array<Author | undefined> }) => {

    const { authors } = props

    return <div className="bookish-authors">
        {
            authors.length === 0 ? 
                "No authors listed" : 
                <em>by </em> 
        }
        {
            authors.map( 
                (author, index) => [
                    author ?
                        author.url ? <a key={"author-" + index} href={author.url} target="_blank">{author.name}</a> : author.name :
                        <span className="bookish-error">Unknown author</span>
                    ,
                    index < authors.length - 1 ? (", ") : null
                ]
            )
        }
    </div>
}

export default Authors