import _map from 'lodash/map';
import React from 'react';
import { Link } from 'react-router-dom';
import { Header } from "./header";
import { Authors } from "./authors";
import { Parser } from "../parser";

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
			return null;
		else if(progress === 0)
			return null;
		else if(progress < 30)
			return "; just started";
		else if(progress < 70)
			return "; halfway";
		else if(progress < 95)
			return "; almost done";
		else
			return "; done";

	}

	render() {

		// Get the chapter progress
		var progress = localStorage.getItem("chapterProgress");
		if(progress === null) {
			progress = {};
		} else {
			progress = JSON.parse(progress);
		}

		var readingTime = this.props.app.getBookReadingTime();

		return (
			<div className="toc">

				<Header 
					image={this.props.app.getCover()} 
					header={this.props.app.getTitle()}
					content={<Authors authors={this.props.app.getAuthors()} contributors={this.props.app.getContributors()} />}
				/>

				{Parser.parseChapter(this.props.app.getDescription()).toDOM()}

				<h2>Chapters <small><small className="text-muted"><em>{readingTime < 60 ? Math.max(5, (Math.floor(readingTime / 10) * 10)) + " minute read" : (new Number(readingTime / 60.0)).toPrecision(1) + " hour read" }</em></small></small></h2>

				<table className="table" id="toc">
					<tbody>
						{
							_map(this.props.app.getChapters(), (chapter, index) => {

								let image = Parser.parseEmbed(chapter.image).toJSON();

								return (
									<tr key={"chapter" + index}>
										<td>
											<img 
												className="img-rounded" 
												style={{width: "5em"}} 
												src={image.url.startsWith("http") ? image.url : "images/" + image.url}
												alt={chapter.alt}
											/>
										</td>
										<td style={{textAlign: "right"}}><em>Chapter {index + 1}</em></td>
										<td>
											{
												// If it's not loaded, say so.
												this.props.app.getContent(chapter.id) === undefined ?
													<span>{chapter.title}</span> :
												// If it failed to load, say so.
												this.props.app.getContent(chapter.id) === null ?
													<div>
														<span>{chapter.title}</span> 
														<br/>
														<small>
															<em>
																Unable to load chapter.
															</em>
														</small>
														
													</div> :
													// If it did load, link it!
													<div>
														<Link to={"/" + chapter.id}>{chapter.title}</Link>
														<br/>
														<small className="text-muted">
															<em>
																{ this.props.app.getChapterReadingTime(chapter.id) } minute read
																{
																	this.getProgressDescription(chapter.id in progress ? progress[chapter.id] : null)
																}
															</em>
														</small>
													</div>
											}
										</td>
									</tr>
								)
							})
						}
						{
							this.props.app.getReferences() === null ? null :
							<tr key="references">
								<td></td>
								<td style={{textAlign: "right"}}><em>@</em></td>
								<td><Link to="/references">References</Link><br/><small className="text-muted"><em>Everything cited</em></small></td>
							</tr>
						}
						<tr key="index">
							<td></td>
							<td style={{textAlign: "right"}}><em>A-Z</em></td>
							<td><Link to="/index/a">Index</Link><br/><small className="text-muted"><em>Common words and where they are</em></small></td>
						</tr>
						<tr key="search">
							<td></td>
							<td style={{textAlign: "right", fontSize: "150%"}}>&#8981;</td>
							<td><Link to="/search">Search</Link><br/><small className="text-muted"><em>Find where words occur</em></small></td>
						</tr>
					</tbody>
				</table>

				<h2>License</h2>

				<p>{this.props.app.getLicense() ? Parser.parseContent(this.props.app.getLicense()).toDOM() : "All rights reserved."}</p>

				<h2>Revisions</h2>
				
				<ul>
					{_map(this.props.app.getRevisions(), (revision, index) => {
						return <li key={"revision" + index}><em>{revision[0]}</em>. {Parser.parseContent(revision[1]).toDOM()}</li>;
					})}
				</ul>

			</div>
		);

	}

}

export {TableOfContents};