import React from 'react';
import { Link } from 'react-router-dom';
import { Header } from "./header";
import { Outline } from './outline';

class Index extends React.Component {

    componentDidMount() {
        window.scrollTo(0, 0);
    }

	render() {

        let book = this.props.app.getBook();

        if(!book.isSpecificationLoaded())
            return null;

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
            if(this.props.match.params.letter === currentLetter) {

                if(count === undefined) {
                    count = 0;
                } 
                else if(count >= 20) {
                    count = 0;
                    rows.push(<tr key={word}><td colSpan={2}><h2 className="header" id={"word-" + word}>{word}</h2></td></tr>)
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

		return (
			<div>
				<Header 
					image={book.getImage("index")} 
					header="Index"
					tags={book.getTags()}
				/>

                <Outline
					previous={null}
					next={null}
				/>

                <p><em>This index includes all words, excluding common English words, words with apostrophes, and words ending in -ly.</em></p>

                <p>Pick a letter to browse:</p>

                <p>
                    { "abcdefghijklmnopqrstuvwxyz".split("").map( 
                        (letter, index) => 
                            <span key={index} style={{display: "inline-block"}}>
                                {
                                    letter in letters && this.props.match.params.letter !== letter ? 
                                        <Link to={"/index/" + letter}>{letter}</Link> :
                                        <span>{this.props.match.params.letter === letter ? <strong><span style={{fontSize: "200%"}}>{letter}</span></strong> : <span className={"text-muted"}>{letter}</span>}</span>
                                }
                                {
                                    index < 26 - 1 ? 
                                        <span>&sdot;</span> : 
                                        null 
                                }
                            </span>
                    )}
                </p>

                <table className="table">
                    <tbody>
                        {rows}
                    </tbody>
                </table>

            </div>
		);

	}

}

export {Index};