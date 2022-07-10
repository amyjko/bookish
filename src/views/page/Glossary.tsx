import React, { useContext, useEffect, useRef, useState } from 'react'

import Header from "./Header"
import Outline from './Outline'
import Page from './Page'
import { renderNode } from '../chapter/Renderer'

import Edition from '../../models/book/Edition.js'
import Parser from '../../models/chapter/Parser'
import { EditorContext } from './Book'
import { Definition } from '../../models/book/Definition.js'
import ConfirmButton from '../editor/ConfirmButton'
import TextEditor from '../editor/TextEditor'
import BookishEditor from '../editor/BookishEditor'
import { FormatNode } from '../../models/chapter/FormatNode'

const Definition = (props: { id: string, definition: Definition }) => {

	const { id, definition } = props;
	const { editable, book } = useContext(EditorContext);
	const [ newSynonym, setNewSynonym ] = useState<boolean>(false);
	const synonymsRef = useRef<HTMLSpanElement>(null);

	// Focus after adding a new synonym.
	useEffect(() => {	
		if(newSynonym && synonymsRef.current) {
			const editors = synonymsRef.current.querySelectorAll(".bookish-editor-synonym input");
			if(editors.length > 0) {
				const last = editors[editors.length - 1];
				if(last instanceof HTMLElement)
					last.focus();
			}
		}
		setNewSynonym(false);

	}, [newSynonym])

	const phrase =
		editable && book ?
			<strong>
				<TextEditor
					text={definition.phrase} 
					label={'Glossary phrase editor.'} 
					placeholder="Phrase"
					valid={ text => {
						if(text.length === 0) return "Phrase can't be empty";
					}}
					save={text => book.editDefinition(id, { 
						phrase: text, 
						definition: definition.definition, 
						synonyms: definition.synonyms
					})}
				/>
			</strong>
			:
			<strong>{definition.phrase || <em>Phrase</em>}</strong>;

	const deleteButton = editable && book ?
		<ConfirmButton
			commandLabel="x"
			confirmLabel="Confirm"
			command={() => book.removeDefinition(id)}
		/>
		: null;

	const format = Parser.parseFormat(undefined, definition.definition).withTextIfEmpty();
	const definitionEditor = 
		editable && book ?
			<BookishEditor<FormatNode> 
			ast={format} 
			save={(node: FormatNode) => book.editDefinition(id, { 
				phrase: definition.phrase, 
				definition: node.toBookdown(), 
				synonyms: definition.synonyms
			})}
			chapter={false}
			placeholder="How would you define this?"
			autofocus={false}
		/> :
		definition.definition === "" ? 
			<em>Definition</em> : 
			renderNode(format) 

	function addSynonym() {
		if(book && definition.synonyms) {
			book.editDefinition(id, { 
				phrase: definition.phrase, 
				definition: definition.definition, 
				synonyms: [ ...definition.synonyms, "" ]
			})
			setNewSynonym(true);
		}
	}

	const syns = definition.synonyms || [];
	const synonymsEditor =
		<span ref={synonymsRef}>
			<button onClick={addSynonym}>+</button>&nbsp;
			{
				syns.length === 0 ?
					<em>No synonyms</em> :
					syns.map((syn, index) => 			
						[
							<span key={`syn-${index}`} className="bookish-editor-synonym bookish-editor-note">
								<TextEditor
									text={syn} 
									label={'Synonym editor.'}
									placeholder="Synonym"
									valid={ text => undefined }
									save={text => {
										const newSyns = [ ...syns ];
										if(text.length === 0)
											newSyns.splice(index, 1);
										else
											newSyns[index] = text;
										return book?.editDefinition(id, { 
											phrase: definition.phrase, 
											definition: definition.definition, 
											synonyms: newSyns
										})
									}}
								/>
							</span>,
							syns.length > 1 && index < syns.length - 1 ? ", " : ""
						]
					)
			}
		</span> 

	// If viewing, don't show any if empty. If editing, show editor if empty.
	const synonyms =
		book && editable ? 
			synonymsEditor :
			definition.synonyms === undefined || definition.synonyms.length === 0 ?
				null :
				<span className="bookish-editor-note"><em>{definition.synonyms.join(", ")}</em></span>

	return <tr>
		<td>
			{ deleteButton } { phrase }
		</td>
		<td>
			{ definitionEditor }
			<br/>
			{ synonyms }
		</td>
	</tr>

}

const Glossary = (props: { book: Edition }) => {

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
				getImage={() => book.getImage(Edition.GlossaryID)}
				setImage={(embed) => book.setImage(Edition.GlossaryID, embed)}
				header="Glossary"
				tags={book.getTags()}
				outline={
					<Outline
						previous={book.getPreviousChapterID(Edition.GlossaryID)}
						next={book.getNextChapterID(Edition.GlossaryID)}
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
								{ keys.map((id, index) => <Definition key={id} id={id} definition={glossary[id]} />) }
								</tbody>
							</table>
						</div>
					</div>
			}
		</Page>
	);

}

export default Glossary