import React, { useEffect } from 'react';

import Header from "./Header";
import Outline from './Outline';
import Page from './Page';

import Parser from "../../models/Parser";
import Book from '../../models/Book';

import { renderNode } from '../chapter/Renderer'

const References = (props: { book: Book }) => {

	useEffect(() => {
	    // Always start at the top of the page.
		window.scrollTo(0, 0)
	}, [])

	const book = props.book;
	const references = book.hasReferences() ? book.getReferences() : null;
	const renderedReferences = [];

	// Otherwise, map references to a list with letter headers.
	if(references !== null) {

		renderedReferences.push(<p key="description"><em>Sorted by last name of first author.</em></p>)

		const sorted = Object.keys(references).sort();
		let letter: undefined | string = undefined;
		sorted.forEach((citationID) => {
			if(letter === undefined || citationID.charAt(0) !== letter) {
				letter = citationID.charAt(0);
				renderedReferences.push(<h2 key={"letter-" + letter} className="bookish-header" id={"references-" + letter}>{letter.toUpperCase()}</h2>);
			}
			renderedReferences.push(<p key={citationID}>{renderNode(Parser.parseReference(references[citationID], book))}</p>);
		})

	}

	return (
		<Page>
			<Header 
				book={book}
				image={book.getImage(Book.ReferencesID)} 
				header="References"
				tags={book.getTags()}
				outline={
					<Outline
						previous={book.getPreviousChapterID(Book.ReferencesID)}
						next={book.getNextChapterID(Book.ReferencesID)}
					/>
				}
			/>

			{
				book.hasReferences() ?
					renderedReferences :
					<p>This book has no references.</p>
			}
		</Page>
	);

}

export default References