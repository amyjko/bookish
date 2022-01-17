import React, { useEffect, useContext } from 'react'
import { Link } from 'react-router-dom'

import Header from "./Header"
import Authors from "../chapter/Authors"
import Page from './Page'
import { renderNode } from '../chapter/Renderer'

import Parser, { EmbedNode } from "../../models/Parser"
import Book from '../../models/Book'
import Outline from './Outline'
import { BaseContext, EditorContext } from './Book'
import BookPreview from '../app/BookPreview'
import TextEditor from '../editor/TextEditor'

const TableOfContents = (props: { book: Book }) => {

	const { base } = useContext(BaseContext)
	const { editable } = useContext(EditorContext)

	// Always start at the top of the page.
	useEffect(() => {
		window.scrollTo(0, 0)

	}, [])

	// Get the book being rendered.
	let book = props.book;

	function getProgressDescription(progress: null | number) {

		if(progress === null)
			return "";
		else if(progress === 0)
			return "";
		else if(progress < 30)
			return "; just started";
		else if(progress < 70)
			return "; halfway";
		else if(progress < 95)
			return "; almost done";
		else
			return "; done";

	}

	function getImage(embed: string | undefined) {

		// No image? Return null for React to render nothing.
		if(!embed)
			return null;

		let embedNode = Parser.parseEmbed(book, embed);
		if(embedNode instanceof EmbedNode) {
			let image = (embedNode as EmbedNode).toJSON();
			return <TableOfContentsImage url={image.url} alt={image.alt}/>
		}
		else return null;

	}

	// Get the chapter progress
	let progressStorage = localStorage.getItem("chapterProgress");
	let progress = progressStorage === null ?
		{} :
		JSON.parse(progressStorage)

	// Is there a colon? Let's make a subtitle
	let title = book.getTitle();
	let subtitle = undefined;
	let colon = title.indexOf(":");
	if(colon >= 0) {
		subtitle = title.substring(colon + 1).trim();
		title = title.substring(0, colon).trim();
	}

	const acknowledgementsHeader = <h2 className="bookish-header" id="acknowledgements">Acknowledgements</h2>
	const description = renderNode(Parser.parseChapter(book, book.getDescription()))


	return <Page>
		<Header 
			book={book}
			label="Book title"
			image={book.getImage("cover")} 
			header={title}
			subtitle={subtitle}
			tags={book.getTags()}
			after={<Authors authors={book.getAuthors()} />}
			outline={
				<Outline
					previous={null}
					next={book.getNextChapterID("")}
				/>
			}
		/>

		<div className="bookish-description">
		{
			editable ? 
				<>
					<TextEditor 
						label="Book description"
						text={book.getDescription()}
						multiline
						save={text => book.setDescription(text)}
					>
					{ description }
					</TextEditor>
				</>
				:
				description
		}
		</div>

		<h2 className="bookish-header" id="chapters">Chapters</h2>
		<div className="bookish-table">
			<table id="toc">
				<tbody>
					{
						book.getChapters().map((chapter, index) => {

							// Get the image, chapter number, and section for rendering.
							const chapterID = chapter.getID();
							const chapterAST = chapter.getAST();
							const chapterNumber = book.getChapterNumber(chapterID);
							const section = chapter.getSection();
							const readingTime = chapter.getReadingTime();
							const readingEstimate =
								readingTime === undefined ? "Forthcoming" :
								readingTime < 5 ? "<5 min read" :
								readingTime < 60 ? "~" + Math.floor(readingTime / 5) * 5 + " min read" :
								"~" + Math.round(10 * readingTime / 60) / 10 + " hour read";

							return (
								<tr key={"chapter" + index} className={chapter.isForthcoming() ? "bookish-forthcoming" : ""}>
									<td>
										{ getImage(chapter.getImage()) }
									</td>
									<td>
										<div>
											{ chapterNumber === undefined ? null : <div className="bookish-chapter-number">{"Chapter " + chapterNumber}</div> }
											<div>
												{
													!chapter.isForthcoming() ? 
														<Link to={base + "/" + chapterID}>{chapter.getTitle()}</Link> :
														<span>{chapter.getTitle()}</span>
												}
											</div>
											{ section === null ? null : <div className="bookish-section-name">{section}</div> }
										</div>
									</td>
									<td>
										<small className="bookish-muted">
											<em>
												{ readingEstimate }
												{ !chapter.isForthcoming() && getProgressDescription(chapterID in progress ? progress[chapterID] : null) }
											</em>
										</small>
										{
											!chapter.isForthcoming() && chapterAST && chapterAST.getErrors().length > 0 ? 
												<span><br/><small className="bookish-error">{chapterAST.getErrors().length + " " + (chapterAST.getErrors().length > 1 ? "errors" : "error")}</small></span> :
												null
										}
									</td>
								</tr>
							)
						})
					}
					{
						!book.hasReferences() ? 
							null :
							<tr key="references">
								<td>{ getImage(book.getImage(Book.ReferencesID)) }</td>
								<td><Link to={base + "/references"}>References</Link><br/><small className="bookish-muted"><em>Everything cited</em></small></td>
								<td></td>
							</tr>
					}
					{
						book.getGlossary() && Object.keys(book.getGlossary()).length > 0 ?
						<tr key="glossary">
							<td>{ getImage(book.getImage(Book.GlossaryID)) }</td>
							<td><Link to={base + "/glossary"}>Glossary</Link><br/><small className="bookish-muted"><em>Definitions</em></small></td>
							<td></td>
						</tr> : null
					}
					<tr key="index">
						<td>{ getImage(book.getImage(Book.IndexID)) }</td>
						<td><Link to={base + "/index/a"}>Index</Link><br/><small className="bookish-muted"><em>Common words and where they are</em></small></td>
						<td></td>
					</tr>
					<tr key="search">
						<td>{ getImage(book.getImage(Book.SearchID)) }</td>
						<td><Link to={base + "/search"}>Search</Link><br/><small className="bookish-muted"><em>Find where words occur</em></small></td>
						<td></td>
					</tr>
					<tr key="media">
						<td>{ getImage(book.getImage(Book.MediaID)) }</td>
						<td><Link to={base + "/media"}>Media</Link><br/><small className="bookish-muted"><em>Images and video in the book</em></small></td>
						<td></td>
					</tr>
				</tbody>
			</table>
		</div>

		{/* If editable, show acknowledgements even if they're empty, otherwise hide */}
		{
			editable ? 
				<>
					{ acknowledgementsHeader }
					<TextEditor 
						label="Acknowledgements"
						text={book.getAcknowledgements()}
						multiline
						save={text => book.setAcknowledgements(text)}
					>
						{ book.getAcknowledgements() ? 
							renderNode(Parser.parseChapter(book, book.getAcknowledgements())) :
							<em>Click to write acknowledgements.</em>
						}
					</TextEditor>
				</>
				:
				book.getAcknowledgements() ?
					<>
						{ acknowledgementsHeader }
						{ renderNode(Parser.parseChapter(book, book.getAcknowledgements())) }
					</>
					: null
		}

		<h2 className="bookish-header" id="license">License</h2>

		<p>
		{
			editable ?
			<>
				<TextEditor 
					label="License"
					text={book.getLicense()}
					multiline
					save={text => book.setLicense(text)}
				>
					{ renderNode(Parser.parseContent(book, book.getLicense())) }
				</TextEditor>
			</>
			:
			renderNode(Parser.parseContent(book, book.getLicense()))

		}

		</p>

		<h2 className="bookish-header" id="print">Print</h2>

		<p>
			Want to print this book or generate a PDF? See <Link to={base + "print"}>all chapters on a single page</Link> and then print or export.
		</p>

		<h2 className="bookish-header" id="citation">Citation</h2>

		<p>
			{ book.getAuthors().map(author => author.name).join(", ") } ({(new Date()).getFullYear() }). <em>{book.getTitle()}</em>. { location.protocol+'//'+location.host+location.pathname }, <em>retrieved { (new Date()).toLocaleDateString("en-US")}</em>.
		</p>

		{
			book.getRevisions().length === 0 ? 
				null :
				<>
					<h2 className="bookish-header" id="revisions">Revisions</h2>
					<ul>
						{book.getRevisions().map((revision, index) => {
							return <li key={"revision" + index}><em>{revision[0]}</em>. { renderNode(Parser.parseContent(book, revision[1])) }</li>;
						})}
					</ul>
				</>	
		}
	</Page>

}

function TableOfContentsImage(props: { url: string, alt: string}) {

	return <img 
		style={{width: "5em"}} 
		// Load the small images. Big ones are too slow!
		src={props.url.startsWith("http") ? props.url : "images/small/" + props.url}
		alt={props.alt}
	/>

}

export default TableOfContents