import _ from 'lodash';
import React from 'react';
import { Link } from 'react-router-dom';
import { Header } from "./header";
import { parseLine, ChapterParser } from "../parser";

class TableOfContents extends React.Component {

	constructor(props) {

		super(props);

	}

	// Always start at the top of the page.
	componentDidMount() {
		window.scrollTo(0, 0)
	}

	render() {

		return (
			<div className="toc">

				<Header 
					image={this.props.app.getCover()} 
					header={this.props.app.getTitle()} 
					content={
						<div>
							<em>by</em> {this.props.app.getAuthors()}
							<small>
								{this.props.app.getContributors() ? 
								<span><em> with contributions from</em> {this.props.app.getContributors()}</span> : null}
							</small>
						</div>
					}
				/>
				
				{(new ChapterParser(this.props.app.getDescription())).getElements()}

				<h2>Chapters</h2>

				<table className="table">
					<tbody>
						{
							_.map(this.props.app.getChapters(), (chapter, index) => {
								return (
									<tr key={"chapter" + index}>
										<td>
											<img 
												className="img-rounded" 
												style={{width: "5em"}} 
												src={"images/" + chapter[2]}
												alt={chapter[3]} 
											/>
										</td>
										<td><em>Chapter {index + 1}</em></td>
										<td>
											{
												// If it's not loaded, say so.
												this.props.app.getContent(chapter[1]) === undefined ?
													<span>Loading...</span> :
												// If it failed to load, say so.
												this.props.app.getContent(chapter[1]) === null ?
													<span>Unable to load this chapter</span> :
												// If it did load, link it!
												<Link to={"/" + chapter[1]}>{chapter[0]}</Link>
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
								<td></td>
								<td><Link to="/references">References</Link></td>
							</tr>
						}
					</tbody>
				</table>

				<h2>Revisions</h2>
				
				<ul>
					{_.map(this.props.app.getRevisions(), (revision, index) => {
						return <li key={"revision" + index}><em>{revision[0]}</em>. {parseLine(revision[1])}</li>;
					})}
				</ul>

			</div>
		);

	}

}

export {TableOfContents};