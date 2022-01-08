import React, { useState, useRef, useContext } from 'react';

import Header from "./Header";
import Outline from './Outline';
import Page from './Page';

import { Link } from 'react-router-dom';
import Book from '../../models/Book';
import { BaseContext } from "./Book"
import { useEffect } from 'react/cjs/react.development';

export default function Search(props) {

    let [ query, setQuery ] = useState("")
    let { base } = useContext(BaseContext)
    const input = useRef(null)

    function handleQueryChange(event) {
        setQuery(event.target.value)
    }

    function handleKeyDown(event) {
        if(event.key === " ") {
            event.preventDefault();
        }
    }

    // Focus the query box when loaded
    useEffect(() => {
        input.current.focus();
    }, [])

    let book = props.book;

    const results = [];
    const lowerQuery = query.toLowerCase();
    let matchCount = 0;

    // Go through all the chapter indexes and find matches.
    if(query.length > 2)
        book.getChapters().forEach(chapter => {
            let chapterID = chapter.getID();
            let index = chapter.getIndex();
            let chapterNumber = book.getChapterNumber(chapterID);

            // No index yet? Skip this chapter.
            if(index === null)
                return;

            // Build a DOM to render matches.
            const chapterMatches = [];

            // What are all of the words in the index that match the query?
            Object.keys(index).forEach(word => {
                if(query.length > 0 && word.indexOf(lowerQuery) >= 0) {
                    index[word].forEach(match => {
                        chapterMatches.push(match);
                    });
                }
            });

            matchCount += chapterMatches.length;

            if(chapterMatches.length > 0) {
                results.push(<h2 key={"header-" + chapterID} className="bookish-header" id={"header-" + chapterID}>Chapter{chapterNumber === undefined ? "" : " " + chapterNumber} - {chapter.getTitle()}</h2>);
                chapterMatches.forEach((match, index) => {
                    // Only highlight the part of the word that matches.
                    const start = match.match.toLowerCase().indexOf(lowerQuery);
                    const left = match.left + match.match.substring(0, start);
                    const wordMatch = <span className="bookish-content-highlight">{match.match.substring(start, start + query.length)}</span>;
                    const right = match.match.substring(start + query.length) + match.right;

                    results.push(<p key={"header-" + chapterID + "-" + index}><Link to={base + "/" + chapterID + "/" + match.match.toLowerCase() + "/" + index}>...{left}{wordMatch}{right}...</Link></p>);
                })
            }

        });

    return <Page>
        <Header 
            book={book}
            image={book.getImage(Book.SearchID)} 
            header="Search"
            tags={book.getTags()}
            outline={
                <Outline
                    previous={book.getPreviousChapterID(Book.SearchID)}
                    next={book.getNextChapterID(Book.SearchID)}
                />    
            }
        />

        <p>Type a word—just a single word—and we'll show its occurrences in this book:</p>

        <p>
            <input 
                type="text" 
                name="query" 
                value={query}
                onChange={handleQueryChange}
                onKeyDown={handleKeyDown}
                placeholder={"search for a word"} 
                ref={input}>
            </input>
        </p>

        {
            query === "" ? null :
            query.length < 3 ? <p>Keep typing...</p> :
            results.length === 0 ? <p>No occurrence of <em>{query}</em>.</p> :
            (
                <div>
                    <p>Found {matchCount} occurrences of <em>{query}</em>...</p>
                    {results}
                </div>
            )
        }

    </Page>

}