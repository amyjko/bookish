import React from 'react'

import Header from "./Header"
import Outline from './Outline'
import Page from './Page'
import { renderNode } from '../chapter/Renderer'

import Book from '../../models/Book.js'
import Parser from '../../models/Parser'

class Glossary extends React.Component {

    // Always start at the top of the page.
	componentDidMount() {
		window.scrollTo(0, 0)
	}

	render() {

		let book = this.props.app.getBook();
        let glossary = book.getGlossary();
		// Sort by canonical phrases
		let keys = glossary === undefined ? null : Object.keys(glossary).sort((a, b) => glossary[a].phrase.localeCompare(glossary[b].phrase));

		return (
			<Page>
				<Header 
					book={book}
					image={book.getImage(Book.GlossaryID)} 
					header="Glossary"
					tags={book.getTags()}
				/>

				<Outline
					previous={book.getPreviousChapterID(Book.GlossaryID)}
					next={book.getNextChapterID(Book.GlossaryID)}
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
											{ renderNode(Parser.parseContent(book, glossary[key].definition)) }
											{ glossary[key].synonyms && glossary[key].synonyms.length > 0 ? <span><br/><br/><em>{glossary[key].synonyms.join(", ")}</em></span> : null }
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

}

export default Glossary