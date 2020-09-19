import _ from 'lodash';
import React from 'react';
import { Link } from 'react-router-dom';
import { NavHashLink } from 'react-router-hash-link';

class Index extends React.Component {

    shouldComponentUpdate() {

        return this.props.app.chaptersAreLoaded();

    }

	render() {

        var bookIndex = this.props.app.getBookIndex();

        var rows = [];
        var currentLetter = undefined;
        var letters = [];

        _.each(Object.keys(bookIndex).sort((a, b) => a.localeCompare(b)), (word, index) => {

            var firstLetter = word.charAt(0).toLowerCase();
            if(currentLetter !== firstLetter) {
                currentLetter = firstLetter;
                letters.push(currentLetter);

                if(this.props.match.params.letter === currentLetter)
                    rows.push(
                        <tr key={"header-" + index} id={"header-" + currentLetter}>
                            <td colSpan={2}><h2>{currentLetter}</h2></td>
                        </tr>
                    );
            }

            if(this.props.match.params.letter === currentLetter)
                rows.push(
                    <tr key={"entry-" + index}>
                        <td>{word}</td>
                        <td>
                            {_.map(
                                bookIndex[word], 
                                (chapter, index) => 
                                    <span key={index}>
                                        <Link to={"/" + chapter + "/" + word}>{this.props.app.getChapterName(chapter)}</Link>
                                        {index < bookIndex[word].length - 1 ? ", " : null}
                                    </span>
                            )}
                        </td>
                    </tr>
                );
        })

        letters = letters.sort((a, b) => a.localeCompare(b));

		return (
			<div>
				<h1>Index</h1>
                <NavHashLink to={"/#toc"}>Table of Contents</NavHashLink>

                <p>Pick a letter. <em>Includes all words, excluding common English words, words with apostrophes, and words ending in -ly.</em></p>

                { _.map(letters, (letter, index) => <strong><Link to={"/index/" + letter}>{letter.toUpperCase()}</Link>{index < letters.length - 1 ? <span>&sdot;</span> : null}</strong>) }

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