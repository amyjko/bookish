import React from 'react';

export default function Authors(props) {

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
                    author.url ? <a key={"author-" + index} href={author.url} target="_blank">{author.name}</a> : author.name,
                    index < authors.length - 1 ? (", ") : null
                ]
            )
        }
    </div>
}