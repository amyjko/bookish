import _ from 'lodash';
import React from 'react';
import ReactDOM from 'react-dom';
import { Route, HashRouter, Switch, withRouter } from 'react-router-dom';

import { Chapter } from "./views/chapter";
import { TableOfContents } from "./views/toc";
import { Unknown } from "./views/unknown";

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

			fetch("chapters/" + chapter[1] + ".md")
				.then((response) => {
					// Uh oh, something bad happened. We couldn't load the chapter.
					if(response.ok) {
						response.text().then(text => {
							// Notify the component that we got a new chapter.
							var updatedChapters = _.clone(this.state.chapters);
							updatedChapters[chapter[1]] = {
								title: chapter[0],
								text: text,
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
		<HashRouter basename={root}>
			<Route path="/" render={(props) => <PeruseWithRouter {...props} book={url}  root={root} /> } />
		</HashRouter>
	), document.getElementById(elementID));
	
}