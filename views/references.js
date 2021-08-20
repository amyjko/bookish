import React from 'react';
import { Link } from 'react-router-dom';

import { Header } from "./header";
import { Outline } from './outline';
import { Page } from './page';

import { Parser } from "../models/parser.js";
import { Book } from '../models/book.js';

class References extends React.Component {

    // Always start at the top of the page.
	componentDidMount() {
		window.scrollTo(0, 0)
	}

	render() {

		const book = this.props.app.getBook();
        const references = book.getReferences();
		const renderedReferences = [];

		// Does this book have any references
		if(!references || references.length === 0) {
			references = null;
		} 
		// Otherwise, map references to a list with letter headers.
		else {

			renderedReferences.push(<p key="description"><em>Sorted by last name of first author.</em></p>)

			const sorted = Object.keys(references).sort();
			let letter = undefined;
			sorted.forEach((citationID) => {
				if(letter === undefined || citationID.charAt(0) !== letter) {
					letter = citationID.charAt(0);
					renderedReferences.push(<h2 key={"letter-" + letter} className="header" id={"references-" + letter}>{letter.toUpperCase()}</h2>);
				}
				renderedReferences.push(<p key={citationID}>{Parser.parseReference(references[citationID], book)}</p>);
			})

		}

		return (
			<Page>
				<div>
					<Header 
						book={book}
						image={book.getImage(Book.ReferencesID)} 
						header="References"
						tags={book.getTags()}
					/>

					<Outline
						previous={book.getPreviousChapterID(Book.ReferencesID)}
						next={book.getNextChapterID(Book.ReferencesID)}
					/>

					{
						references === null ?
							<p>This book has no references.</p> : 
							renderedReferences
					}
				</div>
			</Page>
		);

	}

}

export { References };