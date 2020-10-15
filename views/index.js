import _each from 'lodash/each';
import _map from 'lodash/map';
import React from 'react';
import { Link } from 'react-router-dom';
import { NavHashLink } from 'react-router-hash-link';

class Index extends React.Component {

    shouldComponentUpdate() {

        return this.props.app.chaptersAreLoaded();

    }

    componentDidMount() {
        window.scrollTo(0, 0);
    }

	render() {

        var bookIndex = this.props.app.getBookIndex();

        var rows = [];
        var currentLetter = undefined;
        var letters = {};

        // Build a list of words in alphabetical order.
        _each(Object.keys(bookIndex).sort((a, b) => a.localeCompare(b)), (word, index) => {

            // This block of code renders headers for letter groups
            var firstLetter = word.charAt(0).toLowerCase();

            if(currentLetter !== firstLetter) {
                currentLetter = firstLetter;
                letters[currentLetter] = true;

                // if(this.props.match.params.letter === currentLetter)
                //     rows.push(
                //         <tr key={"header-" + index} id={"header-" + currentLetter}>
                //             <td colSpan={2}><h2>{currentLetter}</h2></td>
                //         </tr>
                //     );
            }

            // Or is this the selected letter?
            if(this.props.match.params.letter === currentLetter)
                rows.push(
                    <tr key={"entry-" + index}>
                        <td>{word}</td>
                        <td>
                            {_map(
                                bookIndex[word], 
                                (chapterID, index) => 
                                    <span key={index}>
                                        Chapter { this.props.app.getChapterNumber(chapterID) !== null ? <span> {this.props.app.getChapterNumber(chapterID)}. </span>: null}<Link to={"/" + chapterID + "/" + word}>{this.props.app.getChapterName(chapterID)}</Link>
                                        {index < bookIndex[word].length - 1 ? <br/> : null}
                                    </span>
                            )}
                        </td>
                    </tr>
                );
        })

		return (
			<div>
				<h1>Index</h1>
                <NavHashLink to={"/#toc"}>Table of Contents</NavHashLink>

                <p><em>This index includes all words, excluding common English words, words with apostrophes, and words ending in -ly.</em></p>

                <p>Pick a letter to browse:</p>

                <p>
                    { _map("abcdefghijklmnopqrstuvwxyz".split(""), 
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
				<div className="navigation-footer">
					<Link to={"/"}>Table of Contents</Link>
				</div>
            </div>
		);

	}

}

export {Index};