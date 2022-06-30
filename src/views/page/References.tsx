import React, { useContext, useEffect, useRef } from 'react';

import Header from "./Header";
import Outline from './Outline';
import Page from './Page';

import Parser from "../../models/Parser";
import Book from '../../models/Book';

import { renderNode } from '../chapter/Renderer'
import { EditorContext } from './Book';
import { ReferenceNode } from '../../models/ReferenceNode';

function mineReference(text: string) {


	// First find the year, since it's the most easily detected. Optional parens.
	let yearMatches = text.match(/(\(?[0-9]{4}\)?)/);
	let year = yearMatches !== null && yearMatches.length > 0 ? yearMatches[1].replace("(", "").replace(")", "") : undefined;
	if(year && yearMatches) text = text.replace(yearMatches[1], "");
	
	// Split the remaining text by period-space sequences, assuming chunks of information are segmented by sentences.
	let chunks = text.split(/[^A-Z]\. /);

	// First find the URL. If we find it, remove it from the chunks.
	let url = chunks.find(t => t.indexOf("http") >= 0);
	if(url) {
		chunks = chunks.filter(t => t !== url);
		url = url.trim();
	}
	
	// Authors are usually lists of roman characters and periods optionally followed by commas or semicolons
	let authors = chunks.find(t => /[a-zA-Z\.]+[,;]?/.test(t));
	if(authors) {
		chunks = chunks.filter(t => t !== authors);
		authors = authors.trim()
	}

	// Titles are usually lists of roman characters and spaces and maybe a colon.
	let title = chunks.find(t => /[a-zA-Z:!#]+/.test(t));
	if(title) {
		chunks = chunks.filter(t => t !== title);
	}

	// Source is whatever is left.
	let source = chunks.length > 0 ? chunks[0] : undefined;

	return new ReferenceNode(authors || "", year || "", title || "", source || "", url || "", "", false);

}

const BulkReferenceEditor = () => {

	const textRef = useRef<HTMLTextAreaElement>(null);

	function handleClick() {

		if(textRef.current === null) return;

		const text = textRef.current.value;

		// Split by lines, skipping empty lines.
		const references = text.split("\n").filter(t => t !== "\n").map(line => mineReference(line));

		console.log(references);		

	}

	return <>
		<p>
			<em>
				Paste some references, one per line, and we'll do our best to pull out the relevant parts,
				looking for things that look like author lists, years, sources, and URLs.
				Be sure to verify it though &mdash; it's likely to get some things wrong!
			</em>
		</p>
		<div>
			<textarea rows={5} ref={textRef} style={{width: "100%"}}></textarea>
			<button onClick={handleClick}>Add references</button>
		</div>
	</>

}

const References = (props: { book: Book }) => {

	const { editable } = useContext(EditorContext)

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
				label="References title"
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
			{
				editable ? <BulkReferenceEditor/> : null
			}
		</Page>
	);

}

export default References