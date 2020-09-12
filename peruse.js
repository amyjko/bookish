import _ from 'lodash';
import React from 'react';
import ReactDOM from 'react-dom';
import { Link, Route, HashRouter, Switch, withRouter } from 'react-router-dom';

import { Chapter } from "./views/chapter";
import { TableOfContents } from "./views/toc";
import { References } from "./views/references";
import { Unknown } from "./views/unknown";

class Peruse extends React.Component {

	constructor(props) {

		super(props);

		// Start data as undefined, rending a loading state until it changes.
		this.state = {
			book: undefined,
			chapters: {}
		};
		
		// Fetch the JSON
		fetch(this.props.book)
			.then(response => response.json())
			.then(data => {
				// Yay, we got data! Set the state, then fetch the chapters.
				this.setState({ book: data }, () => { 
					document.title = this.getTitle();
					this.fetchChapters(); 
				});
			})
			.catch(err => { 
				// Uh oh, something bad happened. Set data to null to render an error.
				this.setState({ book: null });
				console.error("Unable to load " + this.props.book + ": " + err);
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
	getLicense() { return this.getBook().license; }
	getImage(image) {
		return {
			url: image[0],
			alt: image[1],
			caption: image[2],
			credit: image[3]
		}
	
	}
	getCover() { return this.getImage(this.getBook().cover); }
	getUnknown() { return this.getBook() ? this.getImage(this.getBook().unknown) : null; }
	getReferences() { return this.getBook().references; }

	getNextChapter(id) {

		var chapters = this.getChapters();
		for(var i = 0; i < chapters.length; i++) {
			if(chapters[i][1] === id) {
				if(i < chapters.length - 1)
					return this.getContent(chapters[i + 1][1]);
				else
					return null;
			}
		}
		return null;

	}

	getPreviousChapter(id) {

		var chapters = this.getChapters();
		for(var i = 0; i < chapters.length; i++) {
			if(chapters[i][1] === id) {
				if(i > 0)
					return this.getContent(chapters[i - 1][1]);
				else
					return null;
			}
		}
		return null;

	}

	fetchChapters() {

		// Request all of the chapter content...
		_.each(this.getChapters(), (chapter) => {

			var chapterID = chapter[1];

			fetch("chapters/" + chapterID + ".md")
				.then((response) => {
					// Uh oh, something bad happened. We couldn't load the chapter.
					if(response.ok) {
						response.text().then(text => {
							// Notify the component that we got a new chapter.
							var updatedChapters = _.clone(this.state.chapters);
							updatedChapters[chapter[1]] = {
								title: chapter[0],
								text: text,
								id: chapterID,
								image: {
									url: chapter[2],
									alt: chapter[3],
									caption: chapter[4],
									credit: chapter[5]
								}
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
		
		// Return the single page app.
		return (
		
			// If it's loading, show loading feedback
			this.getBook() === undefined ?
				<p>...</p> :
			// If it failed to load, provide some feedback.
			this.getBook() === null ?
				<Unknown message={<p className="alert alert-danger">Wasn't able to load the book <code>{this.props.book}</code>. The book specification probably has a syntax error, but it's also possible that this file doesn't exist or there was a problem with the server..</p>} app={this} /> :
				<Switch>
					<Route exact path="/" render={(props) => <TableOfContents {...props} app={this} />} />
					{
						// Map all the book chapters to routes
						_.map(this.getChapters(), (chapter, index) => {
							return <Route key={"chapter" + index} path={"/" + chapter[1]} render={(props) => <Chapter {...props} id={chapter[1]} app={this} />} />
						})
					}
					<Route path="/references" render={(props) => <References {...props} app={this} />} />
				<Route path="*" render={(props) => <Unknown {...props} message={<p>This URL doesn't exist for this book. Want to go back to the <Link to="/">Table of Contents?</Link></p>} app={this} />}/>
				</Switch>
		
		);

	}
	
}

var PeruseWithRouter = withRouter(Peruse);

window.peruse = function(url) {
	ReactDOM.render((
		<HashRouter>
			<Route path="/" render={(props) => <PeruseWithRouter {...props} book={url} /> } />
		</HashRouter>
	), document.body.appendChild(document.createElement("div")));
}