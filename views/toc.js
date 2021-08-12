import React from 'react';
import { Link } from 'react-router-dom';
import { Header } from "./header";
import { Authors } from "./authors";
import { Parser } from "../models/parser";

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

		let book = this.props.app.getBook();
		let image = Parser.parseEmbed(book, embed).toJSON();
		return <TableOfContentsImage url={image.url} alt={image.alt}/>

	}

	render() {

		// Get the book being rendered.
		let book = this.props.app.getBook();

		// Get the chapter progress
		var progress = localStorage.getItem("chapterProgress");
		if(progress === null) {
			progress = {};
		} else {
			progress = JSON.parse(progress);
		}

		var readingTime = book.getBookReadingTime();

		// Is there a colon? Let's make a subtitle
		let title = book.getTitle();
		let subtitle = null;
		let colon = title.indexOf(":");
		if(colon >= 0) {
			subtitle = title.substr(colon + 1);
			title = title.substr(0, colon);
		}

		return (
			<div className="toc">

				<Header 
					image={book.getImage("cover")} 
					header={title}
					subtitle={subtitle}
					tags={book.getTags()}
					content={<Authors authors={book.getAuthors()} />}
				/>

				{Parser.parseChapter(book, book.getDescription()).toDOM()}

				<h2>Chapters <small><small className="text-muted"><em>{readingTime < 60 ? Math.max(5, (Math.floor(readingTime / 10) * 10)) + " min read" : "~" + Math.round(readingTime / 60.0) + " hour read" }</em></small></small></h2>

				<table className="table" id="toc">
					<tbody>
						{
							book.getChapters().map((chapter, index) => {

								// Get the image, chapter number, and section for rendering.
								let chapterNumber = book.getChapterNumber(chapter.id);
								let section = book.getChapterSection(chapter.id);

								let readingTime = book.getChapterReadingTime(chapter.id);
								let readingEstimate =
									readingTime === undefined ? "Forthcoming" :
									readingTime < 5 ? "<5 min read" :
									readingTime < 60 ? "~" + Math.floor(readingTime / 5) * 5 + " min read" :
									"~" + Math.round(10 * readingTime / 60) / 10 + " hour read";

								return (
									<tr key={"chapter" + index}>
										<td>
											{ this.getImage(chapter.image) }
										</td>
										<td>
											<div>
												{ chapterNumber === undefined ? null : <div className="chapter-number">{"Chapter " + chapterNumber}</div> }
												<div>
													{
														book.chapterIsLoaded(chapter.id) ? 
															<Link to={"/" + chapter.id}>{chapter.title}</Link> :
															<span>{chapter.title}</span>
													}
												</div>
												{ section === null ? null : <div className="section-name">{section}</div> }
											</div>
										</td>
										<td>
											<small className="text-muted">
												<em>
													{ readingEstimate }
													{ this.getProgressDescription(chapter.id in progress ? progress[chapter.id] : null) }
												</em>
											</small>
											{
												chapter.ast && chapter.ast.getErrors().length > 0 ? 
													<span><br/><small className="alert alert-danger">{chapter.ast.getErrors().length + " " + (chapter.ast.getErrors().length > 1 ? "errors" : "error")}</small></span> :
													null
											}
										</td>
									</tr>
								)
							})
						}
						{
							book.getReferences() === null ? null :
							<tr key="references">
								<td>{ this.getImage(book.getImage("references")) }</td>
								<td><Link to="/references">References</Link><br/><small className="text-muted"><em>Everything cited</em></small></td>
								<td></td>
							</tr>
						}
						{
							book.getGlossary() && Object.keys(book.getGlossary()).length > 0 ?
							<tr key="glossary">
								<td>{ this.getImage(book.getImage("glossary")) }</td>
								<td><Link to="/glossary">Glossary</Link><br/><small className="text-muted"><em>Definitions</em></small></td>
								<td></td>
							</tr> : null
						}
						<tr key="index">
							<td>{ this.getImage(book.getImage("index")) }</td>
							<td><Link to="/index/a">Index</Link><br/><small className="text-muted"><em>Common words and where they are</em></small></td>
							<td></td>
						</tr>
						<tr key="search">
							<td>{ this.getImage(book.getImage("search")) }</td>
							<td><Link to="/search">Search</Link><br/><small className="text-muted"><em>Find where words occur</em></small></td>
							<td></td>
						</tr>
					</tbody>
				</table>

				{
					book.getAcknowledgements() ?
						<>
							<h2>Acknowledgements</h2>
							{ Parser.parseChapter(book, book.getAcknowledgements()).toDOM() }
						</>
						: null
				}

				<h2>License</h2>

				<p>
					{book.getLicense() ? Parser.parseContent(book, book.getLicense()).toDOM() : "All rights reserved."}
				</p>

				<h2>Citation</h2>

				<p>
					{ book.getAuthors().map(author => author.name).join(", ") } ({(new Date()).getFullYear() }). <em>{title}</em>. { location.protocol+'//'+location.host+location.pathname }, <em>retrieved { (new Date()).toLocaleDateString("en-US")}</em>.
				</p>

				{
					book.getRevisions().length === 0 ? 
						null :
						<>
							<h2>Revisions</h2>
							<ul>
								{book.getRevisions().map((revision, index) => {
									return <li key={"revision" + index}><em>{revision[0]}</em>. {Parser.parseContent(book, revision[1]).toDOM()}</li>;
								})}
							</ul>
						</>	
				}

			</div>
		);

	}

}

class TableOfContentsImage extends React.Component {

	render() {

		return <img 
			className="img-rounded" 
			style={{width: "5em"}} 
			src={this.props.url.startsWith("http") ? this.props.url : "images/" + this.props.url}
			alt={this.props.alt}
		/>

	}

}

export { TableOfContents };