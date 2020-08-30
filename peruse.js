import _ from 'lodash';
import React from 'react';
import ReactDOM from 'react-dom';
import { Link, Route, BrowserRouter, Switch, withRouter } from 'react-router-dom';

import 'bootstrap';

class Chapter extends React.Component {

	render() {

		var chapter = this.props.app.getContent(this.props.id);

		return (
			<div>
				<h1>{chapter.title}</h1>
				<p>{chapter.text}</p>
			</div>
		);

	}

}

class Header extends React.Component {

	render() {

		return (
			<div>
				<CaptionedImage {...this.props.image}/>
				<h1>{this.props.header}</h1>
				<div className="lead">{this.props.content}</div>
			</div>
		);

	}

}

class CaptionedImage extends React.Component {

	render() {
		return (
			<div className="figure">
				<img className="img-fluid figure-img" src={"images/" + this.props.url} alt={this.props.alt} />		
				<div className="figure-caption">{this.props.caption} <em>Credit: {this.props.credit}</em></div>
			</div>
		)
	}

}

class TableOfContents extends React.Component {

	constructor(props) {

		super(props);

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
								<span> with contributions from {this.props.app.getContributors()}</span> : null}
							</small>
						</div>
					}
				/>
				
				<p className="tight">{this.props.app.getDescription()}</p>

				<h2>Chapters</h2>

				<table className="table">
					<tbody>
						{
							_.map(this.props.app.getChapters(), (chapter, index) => {
								return (
									<tr key={"chapter" + index}>
										<td><em>{chapter[0]}</em></td>
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
					</tbody>
				</table>

				<h2>Revision history</h2>
				
				<ul>
					{_.map(this.props.app.getRevisions(), (revision, index) => {
						return <li key={"revision" + index}><em>{revision[0]}</em>. {revision[1]}</li>;
					})}
				</ul>

			</div>
		);

	}

}

class Unknown extends React.Component {

	render() {

		return <Header 
			image={this.props.app.getUnknown()} 
			header="Uh oh." 
			content={<p>This URL doesn't exist for this book. Want to go back to the <Link to="/">table of contents?</Link></p>}
		/>

	}

}

class Peruse extends React.Component {

	constructor(props) {

		super(props);

		// Start data as undefined, rending a loading state until it changes.
		this.state = {
			book: undefined,
			chapters: {}
		};
		
		fetch(this.props.book)
			.then(response => response.json())
			.then(data => {
				// Yay, we got data! Set the state, then fetch the chapters.
				this.setState({ book: data }, () => { this.fetchChapters(); });
			})
			.catch(err => { 
				// Uh oh, something bad happened. Set data to null to render an error.
				this.setState({ data: null });
				console.error(err);
			});

	}

	getBook() { return this.state.book; }
	getContent(chapterID) { return _.has(this.state.chapters, chapterID) ? this.state.chapters[chapterID] : undefined; }
	getTitle() { return this.getBook().title; }
	getAuthors() { return this.getBook().authors.join(", "); }
	getContributors() { return this.getBook().contributors == null ? null : this.getBook().contributors.join(", "); }
	getDescription() { return this.getBook().description; }
	getRevisions() { return this.getBook().revisions; }
	getChapters() { return this.getBook().chapters; }
	getImage(image) {
		return {
			url: image[0],
			alt: image[1],
			caption: image[2],
			credit: image[3]
		}
	
	}
	getCover() { return this.getImage(this.getBook().cover); }
	getUnknown() { return this.getImage(this.getBook().unknown); }

	fetchChapters() {

		// Request all of the chapter content...
		_.each(this.getChapters(), (chapter) => {

			fetch("chapters/" + chapter[1])
				.then((response) => {
					// Uh oh, something bad happened. We couldn't load the chapter.
					if(response.ok) {
						response.text().then(text => {
							// Notify the component that we got a new chapter.
							var updatedChapters = _.clone(this.state.chapters);
							updatedChapters[chapter[1]] = {
								title: chapter[0],
								text: text
							};
							this.setState({ chapters: updatedChapters });
						});
					}
					else {
						var updatedChapters = _.clone(this.state.chapters);
						updatedChapters[chapter[1]] = null;
						this.setState({ chapters: updatedChapters });
					}
				})
				.catch(err => { 
					// Uh oh, something bad happened. We couldn't load the chapter.
					var updatedChapters = _.clone(this.state.chapters);
					updatedChapters[chapter[1]] = null;
					// Notify the component that we got a new chapter.
					this.setState({ chapters: updatedChapters });
					// Tell the dev about the problem.
					console.error(err);
				});

		});

	}
	
	render() {
		
		// var currentRoute = this.props.location.pathname;
		
		// Return the single page app.
		return (
		
			this.getBook() == null ?
				<p>Loading the book...</p> :
				<Switch>
					<Route exact path="/" render={(props) => <TableOfContents {...props} app={this} />} />
					{
						// Map all the book chapters to routes
						_.map(this.getChapters(), (chapter, index) => {
							return <Route key={"chapter" + index} path={"/" + chapter[1]} render={(props) => <Chapter {...props} id={chapter[1]} app={this} />} />
						})
					}
					<Route path="*" render={(props) => <Unknown {...props} app={this} />}/>
				</Switch>
		
		);

	}
	
}

var PeruseWithRouter = withRouter(Peruse);

window.peruse = function(url, elementID, root) {
	
	ReactDOM.render((
		<BrowserRouter basename={root}>
			<Route path="/" render={(props) => <PeruseWithRouter {...props} book={url}  root={root} /> } />
		</BrowserRouter>
	), document.getElementById(elementID));
	
}