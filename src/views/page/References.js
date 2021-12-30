import React from 'react';

import Header from "./Header";
import Outline from './Outline';
import Page from './Page';

import Parser from "../../models/Parser";
import Book from '../../models/Book';

import { renderNode } from '../chapter/Renderer'

class References extends React.Component {

    // Always start at the top of the page.
	componentDidMount() {
		window.scrollTo(0, 0)
	}

	render() {

		const book = this.props.app.getBook();
        const references = book.hasReferences() ? book.getReferences() : null;
		const renderedReferences = [];

		// Otherwise, map references to a list with letter headers.
		if(references !== null) {

			renderedReferences.push(<p key="description"><em>Sorted by last name of first author.</em></p>)

			const sorted = Object.keys(references).sort();
			let letter = undefined;
			sorted.forEach((citationID) => {
				if(letter === undefined || citationID.charAt(0) !== letter) {
					letter = citationID.charAt(0);
					renderedReferences.push(<h2 key={"letter-" + letter} id={"references-" + letter}>{letter.toUpperCase()}</h2>);
				}
				renderedReferences.push(<p key={citationID}>{renderNode(Parser.parseReference(references[citationID], book))}</p>);
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
						book.hasReferences() ?
							renderedReferences :
							<p>This book has no references.</p>
					}
				</div>
			</Page>
		);

	}

}

export default References