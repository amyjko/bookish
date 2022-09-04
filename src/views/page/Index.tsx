import React, { useContext } from 'react'
import { Link, useParams } from 'react-router-dom';

import Header from "./Header";
import Outline from './Outline';
import Page from './Page';

import Edition from '../../models/book/Edition';
import { BaseContext } from './Edition';
import Instructions from './Instructions';

const Index = (props: { book: Edition }) => {

    // What letter are we matching?
    const { letter } = useParams()
    const { base } = useContext(BaseContext)

    let book = props.book;

    let bookIndex = book.getBookIndex();

    let rows: React.ReactNode[] = [];
    let currentLetter: undefined | string = undefined;
    let letters: Record<string, boolean> = {};
    let count: undefined | number = undefined;

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
                rows.push(<tr key={word}><td colSpan={2}><h2 className="bookish-header" id={"word-" + word}>{word}</h2></td></tr>)
            }

            rows.push(
                <tr key={"entry-" + index}>
                    <td>{word}</td>
                    <td>
                        {
                            // Sort the chapters by chapter number
                            Array.from(bookIndex[word])
                                .sort((a, b) => {
                                    let numberA = book.getChapterNumber(a);
                                    let numberB = book.getChapterNumber(b);
                                    if(numberA === undefined) return -1;
                                    if(numberB === undefined) return 1;
                                    return numberA - numberB;
                                })
                                // Map them to links to the first occurrence in the chapter.
                                .map(
                                    (chapterID, index) => 
                                        <span key={index}>
                                            Chapter { book.getChapterNumber(chapterID) !== undefined ? <span> {book.getChapterNumber(chapterID)}. </span> : null}<Link to={base + "/" + chapterID + "/" + word + "/0"}>{book.getChapterName(chapterID)}</Link>
                                            {index < bookIndex[word].size - 1 ? <br/> : null}
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
            label="Index title"
			getImage={() => book.getImage(Edition.IndexID)}
			setImage={(embed) => book.setImage(Edition.IndexID, embed)}
            header="Index"
            tags={book.getTags()}
            outline={
                <Outline
                    previous={book.getPreviousChapterID(Edition.IndexID)}
                    next={book.getNextChapterID(Edition.IndexID)}
                />
            }
        />

        <Instructions>
            This index is created automatically.
            It's not perfect; we may add more control over it in the future.
        </Instructions>

        <p><em>This index includes all words, excluding common English words, words with apostrophes, and words ending in -ly.</em></p>

        <p>Pick a letter to browse:</p>

        <p>
            { "abcdefghijklmnopqrstuvwxyz".split("").map( 
                (symbol, index) => 
                    <span key={index} style={{display: "inline-block"}}>
                        {
                            symbol in letters && letter !== symbol ? 
                                <Link to={base + "/index/" + symbol}>{symbol}</Link> :
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

export default Index