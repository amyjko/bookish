import React, { useContext, useEffect } from 'react'

import Header from "./Header"
import Outline from './Outline'
import Page from './Page'
import { renderNode } from '../chapter/Renderer'

import Book from '../../models/Book.js'
import Parser from '../../models/Parser'
import { EditorContext } from './Book'
import { Definition } from '../../models/Book.js'
import ConfirmButton from '../editor/ConfirmButton'

const Definition = (props: { id: string, definition: Definition }) => {

	const { id, definition } = props;
	const { editable, book } = useContext(EditorContext);

	return <tr>
		<td>
			<strong>{definition.phrase || <em>Phrase</em>}</strong>
			{ editable ? <><br/><span className="bookish-editor-note">{id}</span></> : null }
			{
				editable && book ?
				<>
					<br/>
					<ConfirmButton
						commandLabel="x"
						confirmLabel="Confirm"
						command={() => book.removeDefinition(id)}
					/>
				</> : null
				
			}
		</td>
		<td>
			{ 
				definition.definition === "" ? 
					<em>Definition</em> :
					renderNode(Parser.parseFormat(undefined, definition.definition)) 
			}
			<br/><br/>
			{
				definition.synonyms === undefined || definition.synonyms.length === 0 ?
					(editable ? <em>Synonyms</em> : null) :
					<span><em>{definition.synonyms.join(", ")}</em></span> 
			}
		</td>
	</tr>

}

const Glossary = (props: { book: Book }) => {

	const { editable } = useContext(EditorContext);

	useEffect(() => {
	    // Always start at the top of the page.
		window.scrollTo(0, 0)
	}, [])

	let book = props.book;
	let glossary = book.getGlossary();
	// Sort by canonical phrases
	let keys = glossary === undefined || Object.keys(glossary).length === 0 ? null : Object.keys(glossary).sort((a, b) => glossary[a].phrase.localeCompare(glossary[b].phrase));

	function addEmptyDefinition() {

		// Generate an ID.
		const letters = "abcdefghijklmnopqrstuvwxyz".split("");
		let id = "";
		while(id.length < 4 || book.hasDefinition(id))
			id = id + letters[Math.round(Math.random() * 26)];
		book.addDefinition(id, "", "", []);

	}

	return (
		<Page>
			<Header 
				book={book}
				label="Glossary title"
				image={book.getImage(Book.GlossaryID)} 
				header="Glossary"
				tags={book.getTags()}
				outline={
					<Outline
						previous={book.getPreviousChapterID(Book.GlossaryID)}
						next={book.getNextChapterID(Book.GlossaryID)}
					/>
				}
			/>
			{
				editable ?
				<>
					<p>Add definitions and then link to them in a chapter's text.</p>
					<p><button onClick={addEmptyDefinition}>+</button></p>
				</> : null
			}
			{
				keys === null ? 
					<p>This book has no glossary.</p> :
					<div>
						<br/>
						<div className="bookish-table">
							<table>
								<colgroup>
									<col style={{width: "40%" }} />
									<col style={{width: "60%" }} />
								</colgroup>
								<tbody>
								{ keys.map((id, index) => <Definition key={index} id={id} definition={glossary[id]} />) }
								</tbody>
							</table>
						</div>
					</div>
			}
		</Page>
	);

}

export default Glossary