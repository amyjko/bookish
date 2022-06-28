import React, { useEffect } from 'react'

import Header from "./Header"
import Outline from './Outline'
import Page from './Page'
import { renderNode } from '../chapter/Renderer'

import Book from '../../models/Book.js'
import Parser from '../../models/Parser'

const Glossary = (props: { book: Book }) => {

	useEffect(() => {
	    // Always start at the top of the page.
		window.scrollTo(0, 0)
	}, [])

	let book = props.book;
	let glossary = book.getGlossary();
	// Sort by canonical phrases
	let keys = glossary === undefined ? null : Object.keys(glossary).sort((a, b) => glossary[a].phrase.localeCompare(glossary[b].phrase));

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
				keys === null ? 
					<p>This book has no glossary.</p> :
				<div>
					<br/>
					<div className="bookish-table">
						<table>
							<tbody>
							{ keys.map((key, index) => 
								<tr key={"definition" + index}>
									<td><strong>{glossary[key].phrase}</strong></td>
									<td>
										{ renderNode(Parser.parseFormat(book, glossary[key].definition)) }
										{ <span><br/><br/><em>{glossary[key].synonyms?.join(", ")}</em></span> ?? null }
									</td>
								</tr>
							)}
							</tbody>
						</table>
					</div>
				</div>
			}
		</Page>
	);

}

export default Glossary