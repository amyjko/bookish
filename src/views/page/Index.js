import React from 'react'
import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';

import Header from "./Header";
import Outline from './Outline';
import Page from './Page';

import Book from '../../models/Book';

export default function Index(props) {

    // What letter are we matching?
    const { letter } = useParams()

    let book = props.book;

    let bookIndex = book.getBookIndex();

    let rows = [];
    let currentLetter = undefined;
    let letters = {};
    let count = undefined;

    // Build a list of words in alphabetical order.
    Object.keys(bookIndex).sort((a, b) => a.localeCompare(b)).forEach((word, index) => {

        // This block of code renders headers for letter groups
        let firstLetter = word.charAt(0).toLowerCase();

        // Update the letter that we're on.
        if(currentLetter !== firstLetter) {
            currentLetter = firstLetter;
            letters[currentLetter] = true;
        }

        // If this is the first letter, add an entry!
        if(letter === currentLetter) {

            if(count === undefined) {
                count = 0;
            } 
            else if(count >= 20) {
                count = 0;
                rows.push(<tr key={word}><td colSpan={2}><h2 id={"word-" + word}>{word}</h2></td></tr>)
            }

            rows.push(
                <tr key={"entry-" + index}>
                    <td>{word}</td>
                    <td>
                        {
                            // Sort the chapters by chapter number
                            bookIndex[word]
                                .sort((a, b) => {
                                    let numberA = book.getChapterNumber(a);
                                    let numberB = book.getChapterNumber(b);
                                    if(numberA === undefined) return -1;
                                    if(numberB === undefined) return 1;
                                    return numberA - numberB;
                                })
                                .map(
                                    (chapterID, index) => 
                                        <span key={index}>
                                            Chapter { book.getChapterNumber(chapterID) !== undefined ? <span> {book.getChapterNumber(chapterID)}. </span> : null}<Link to={"/" + chapterID + "/" + word}>{book.getChapterName(chapterID)}</Link>
                                            {index < bookIndex[word].length - 1 ? <br/> : null}
                                        </span>
                        )}
                    </td>
                </tr>
            );
            count++;
        }

    });

    return <Page>
        <Header 
            book={book}
            image={book.getImage(Book.IndexID)} 
            header="Index"
            tags={book.getTags()}
        />

        <Outline
            previous={book.getPreviousChapterID(Book.IndexID)}
            next={book.getNextChapterID(Book.IndexID)}
        />

        <p><em>This index includes all words, excluding common English words, words with apostrophes, and words ending in -ly.</em></p>

        <p>Pick a letter to browse:</p>

        <p>
            { "abcdefghijklmnopqrstuvwxyz".split("").map( 
                (symbol, index) => 
                    <span key={index} style={{display: "inline-block"}}>
                        {
                            symbol in letters && letter !== symbol ? 
                                <Link to={"/index/" + symbol}>{symbol}</Link> :
                                <span>
                                    {
                                        letter === symbol ? 
                                            <strong><span style={{fontSize: "200%"}}>{symbol}</span></strong> : 
                                            <span className={"bookish-muted"}>{symbol}</span>
                                    }
                                </span>
                        }
                        {
                            index < 26 - 1 ? 
                                <span>&sdot;</span> : 
                                null 
                        }
                    </span>
            )}
        </p>

        <div className="bookish-table">
            <table>
                <tbody>
                    { rows }
                </tbody>
            </table>
        </div>
    </Page>

}