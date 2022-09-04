import React, { useContext, useEffect, useRef, useState } from 'react';

import Header from "./Header";
import Outline from './Outline';
import Page from './Page';

import Parser from "../../models/chapter/Parser";
import Edition from '../../models/book/Edition';

import { renderNode } from '../chapter/Renderer'
import { EditorContext } from './Edition';
import { ReferenceNode } from '../../models/chapter/ReferenceNode';
import ConfirmButton from '../editor/ConfirmButton';
import Instructions from './Instructions';

function mineReference(ids: string[], text: string): ReferenceNode {

	// First find the year, since it's the most easily detected. Optional parens.
	let yearMatches = text.match(/(\(?[0-9]{4}\)?)/);
	let year = yearMatches !== null && yearMatches.length > 0 ? yearMatches[1].replace("(", "").replace(")", "") : undefined;
	if(year && yearMatches) text = text.replace(yearMatches[1], "");
	
	// Split the remaining text by period-space sequences, assuming chunks of information are segmented by sentences.
	// let chunks = text.split(/(?<![A-Z])[?.]\s/);
	// Grrr, Safari doesn't support negative lookbehind. I'm going to break this until I have time for a fix.
	let chunks = text.split(/[?.]\s/);

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
	let title = chunks.find(t => /[a-zA-Z0-9:!#?]+/.test(t));
	if(title) {
		chunks = chunks.filter(t => t !== title);
		if(text.charAt(text.indexOf(title) + title.length) === "?")
			title = title + "?";
	}

	// Source is whatever is left.
	let source = chunks.length > 0 ? chunks[0] : undefined;
	if(source) {
		chunks = chunks.filter(t => t !== source);
	}

	// If there's anything left, fall back to just a string.
	return chunks.length > 0 ? 
		new ReferenceNode(getUniqueID(ids), text) : 
		new ReferenceNode(getUniqueID(ids, authors, year), authors || "", year || "", title || "", source || "", url || "", "", false);

}

function getUniqueID(ids: string[], authors?: string, year?: string): string {

	if(authors && year) {
		// Split the authors, combine the first initials of each, then append the year.
		const semicolons = authors.includes(";");
		const authorList = authors.split(semicolons ? /;\s+/ : /,\s+/).map(t => t.trim());
		const initials = authorList.map(a => a.charAt(0).toLocaleLowerCase());
		const id = initials.join("") + year;
		let revisedID = id;
		let letters = "abcdefghijklmnopqrstuv".split("");
		while(ids.includes(revisedID) || revisedID.length === 0) {
			const letter = letters.shift();
			revisedID = id + (letter !== undefined ? letter : Math.floor(Math.random() * 10));
		}
		return revisedID;
	}
	else {
		let id = "ref";
		for(let i = 0; i < 4; i++)
			 id = id + Math.round(Math.random() * 9);
		return id;
	}
}

const BulkReferenceEditor = (props: { book: Edition }) => {

	const { edition: book } = useContext(EditorContext);

	const textRef = useRef<HTMLTextAreaElement>(null);
	const [ text, setText ] = useState<string>("");

	function handleBulkAdd() {

		if(!book) return;
		if(textRef.current === null) return;

		const text = textRef.current.value;

		// Split by lines, skipping empty lines.
		const references = text.split(/\n+/).map(line => mineReference(Object.keys(book.getReferences()), line));

		props.book.addReferences(references)
			.catch(() => {
				alert("Failed to save references.")
			});

	}

	function handleEmptyAdd() {

		if(!book) return;
		props.book.addReferences([new ReferenceNode(getUniqueID(Object.keys(book.getReferences())))])
			.catch(() => {
				alert("Failed to save empty reference.");
			})

	}

	function handleChange() { setText(textRef.current ? textRef.current.value : ""); }

	return <>
		<Instructions>
			To cite references in a chapter, add them here.
			You can add one at a time, or try pasting them in bulk, and we'll do our best to pull out the relevant parts, looking for things that look like author lists, years, sources, and URLs.
			Be sure to verify it though &mdash; it's likely to get some things wrong!
		</Instructions>
		<div>
			<textarea onChange={handleChange} rows={5} ref={textRef} style={{width: "100%"}}></textarea>
			<button disabled={text.length === 0} onClick={handleBulkAdd}>Add bulk references</button>
			<button onClick={handleEmptyAdd}>Add empty reference</button>
		</div>
	</>

}

const References = (props: { book: Edition }) => {

	const { editable } = useContext(EditorContext);

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
		sorted.forEach((citationID, index) => {

			const ref = Parser.parseReference(citationID, references[citationID], book);

			if(letter === undefined || citationID.charAt(0) !== letter) {
				letter = citationID.charAt(0);
				renderedReferences.push(<h2 key={"letter-" + letter} className="bookish-header" id={"references-" + letter}>{letter.toUpperCase()}</h2>);
			}

			const deleteButton = <ConfirmButton
				commandLabel="x"
				confirmLabel="Confirm"
				command={() => book.removeReference(citationID)}
			/>
	
			renderedReferences.push(<p key={`citation${citationID}`}>{renderNode(ref)} {editable ? <>{deleteButton}</> : null}</p>);
		})

	}

	return (
		<Page>
			<Header 
				book={book}
				label="References title"
				getImage={() => book.getImage(Edition.ReferencesID)}
				setImage={(embed) => book.setImage(Edition.ReferencesID, embed)}
				header="References"
				tags={book.getTags()}
				outline={
					<Outline
						previous={book.getPreviousChapterID(Edition.ReferencesID)}
						next={book.getNextChapterID(Edition.ReferencesID)}
					/>
				}
			/>

			{
				editable ? <BulkReferenceEditor book={book}/> : null
			}
			{
				book.hasReferences() ?
					renderedReferences :
					<p>This book has no references.</p>
			}
		</Page>
	);

}

export default References