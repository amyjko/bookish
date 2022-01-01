import React from 'react'
import { Link } from 'react-router-dom'

import ChapterHeader from "./Header"
import Authors from "../chapter/Authors"
import Page from './Page'
import { renderNode } from '../chapter/Renderer'

import Parser from "../../models/Parser"
import Book from '../../models/Book'

class TableOfContents extends React.Component {

	constructor(props) {
		super(props);
	}

	// Always start at the top of the page.
	componentDidMount() {
		window.scrollTo(0, 0)
	}

	getProgressDescription(progress) {

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

	getImage(embed) {

		if(embed === null)
			return null;

		let book = this.props.book;
		let image = Parser.parseEmbed(book, embed).toJSON();
		return <TableOfContentsImage url={image.url} alt={image.alt}/>

	}

	render() {

		// Get the book being rendered.
		let book = this.props.book;

		// Get the chapter progress
		let progress = localStorage.getItem("chapterProgress");
		if(progress === null) {
			progress = {};
		} else {
			progress = JSON.parse(progress);
		}

		const readingTime = book.getBookReadingTime();

		// Is there a colon? Let's make a subtitle
		let title = book.getTitle();
		let subtitle = null;
		let colon = title.indexOf(":");
		if(colon >= 0) {
			subtitle = title.substr(colon + 1);
			title = title.substr(0, colon);
		}

		return (
			<Page loaded={this.afterLoad}>
				<ChapterHeader 
					book={book}
					image={book.getImage("cover")} 
					header={title}
					subtitle={subtitle}
					tags={book.getTags()}
					after={<Authors authors={book.getAuthors()} />}
				/>

				<div className="bookish-description">
					{ renderNode(Parser.parseChapter(book, book.getDescription())) }
				</div>

				<h2>Chapters <small><small className="bookish-muted"><em>{readingTime < 60 ? Math.max(5, (Math.floor(readingTime / 10) * 10)) + " min read" : "~" + Math.round(readingTime / 60.0) + " hour read" }</em></small></small></h2>

				<div className="bookish-table">
					<table id="toc">
						<tbody>
							{
								book.getChapters().map((chapter, index) => {

									// Get the image, chapter number, and section for rendering.
									const chapterID = chapter.getID();
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
												{ this.getImage(chapter.getImage()) }
											</td>
											<td>
												<div>
													{ chapterNumber === undefined ? null : <div className="bookish-chapter-number">{"Chapter " + chapterNumber}</div> }
													<div>
														{
															!chapter.isForthcoming() ? 
																<Link to={"/" + chapterID}>{chapter.getTitle()}</Link> :
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
														{ !chapter.isForthcoming() && this.getProgressDescription(chapterID in progress ? progress[chapterID] : null) }
													</em>
												</small>
												{
													!chapter.isForthcoming() && chapter.getAST().getErrors().length > 0 ? 
														<span><br/><small className="bookish-error">{chapter.getAST().getErrors().length + " " + (chapter.getAST().getErrors().length > 1 ? "errors" : "error")}</small></span> :
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
										<td>{ this.getImage(book.getImage(Book.ReferencesID)) }</td>
										<td><Link to="/references">References</Link><br/><small className="bookish-muted"><em>Everything cited</em></small></td>
										<td></td>
									</tr>
							}
							{
								book.getGlossary() && Object.keys(book.getGlossary()).length > 0 ?
								<tr key="glossary">
									<td>{ this.getImage(book.getImage(Book.GlossaryID)) }</td>
									<td><Link to="/glossary">Glossary</Link><br/><small className="bookish-muted"><em>Definitions</em></small></td>
									<td></td>
								</tr> : null
							}
							<tr key="index">
								<td>{ this.getImage(book.getImage(Book.IndexID)) }</td>
								<td><Link to="/index/a">Index</Link><br/><small className="bookish-muted"><em>Common words and where they are</em></small></td>
								<td></td>
							</tr>
							<tr key="search">
								<td>{ this.getImage(book.getImage(Book.SearchID)) }</td>
								<td><Link to="/search">Search</Link><br/><small className="bookish-muted"><em>Find where words occur</em></small></td>
								<td></td>
							</tr>
							<tr key="media">
								<td>{ this.getImage(book.getImage(Book.MediaID)) }</td>
								<td><Link to="/media">Media</Link><br/><small className="bookish-muted"><em>Images and video in the book</em></small></td>
								<td></td>
							</tr>
						</tbody>
					</table>
				</div>

				{
					book.getAcknowledgements() ?
						<>
							<h2>Acknowledgements</h2>
							{ renderNode(Parser.parseChapter(book, book.getAcknowledgements())) }
						</>
						: null
				}

				<h2>License</h2>

				<p>
					{ book.getLicense() ? renderNode(Parser.parseContent(book, book.getLicense())) : "All rights reserved." }
				</p>

				<h2>Print</h2>

				<p>
					Want to print this book or generate a PDF? See <Link to="/print">all chapters on a single page</Link> and then print or export.
				</p>

				<h2>Citation</h2>

				<p>
					{ book.getAuthors().map(author => author.name).join(", ") } ({(new Date()).getFullYear() }). <em>{book.getTitle()}</em>. { location.protocol+'//'+location.host+location.pathname }, <em>retrieved { (new Date()).toLocaleDateString("en-US")}</em>.
				</p>

				{
					book.getRevisions().length === 0 ? 
						null :
						<>
							<h2>Revisions</h2>
							<ul>
								{book.getRevisions().map((revision, index) => {
									return <li key={"revision" + index}><em>{revision[0]}</em>. { renderNode(Parser.parseContent(book, revision[1])) }</li>;
								})}
							</ul>
						</>	
				}
			</Page>
		)

	}

}

class TableOfContentsImage extends React.Component {

	render() {

		return <img 
			style={{width: "5em"}} 
			// Load the small images. Big ones are too slow!
			src={this.props.url.startsWith("http") ? this.props.url : "images/small/" + this.props.url}
			alt={this.props.alt}
		/>

	}

}

export default TableOfContents