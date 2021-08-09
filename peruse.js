import React from 'react';
import ReactDOM from 'react-dom';
import { Link, Route, HashRouter, Switch, withRouter } from 'react-router-dom';

import { Book } from "./models/book";
import { Chapter } from "./views/chapter";
import { TableOfContents } from "./views/toc";
import { References } from "./views/references";
import { Glossary } from "./views/glossary"
import { Index } from "./views/index";
import { Search } from "./views/search";
import { Unknown } from "./views/unknown";

class Peruse extends React.Component {

	constructor(props) {

		super(props);

		// Start data as undefined, rending a loading state until it changes.
		this.state = {
			// Make a Book instance to load the book. When something loads, update.
			book: new Book(
				this.props.book,
				this.forceUpdate.bind(this)
			),
			loadingTime: undefined
		};
		
		// Lookup table for optimization
		this.chapterNumbers = {};

	}

	componentDidMount() {

		// Set the window title to the title of the book.

		// Keep track of how long it's been since we started loading the book, so we can show feedback
		// if it's been more than a certain period of time. We'll check every 100 milliseconds.
		this.loadingStartTime = Date.now();
		this.loadingCheck = setInterval(() => { 

			this.setState({loadingTime: Date.now() - this.loadingStartTime});
			if(this.state.book !== null) {
				clearInterval(this.loadingCheck);
			}

		}, 100);

	}

	getBook() { return this.state.book; }
	
	render() {

		let book = this.state.book;
		
		// If it's loading, show loading feedback
		if(book.getSpecification() === undefined) {
			if(this.state.loadingTime === undefined || this.state.loadingTime < 500)
				return null;
			else
				return <div className="text-center text-muted" style={{position: "fixed", left: "50%", top: "50%", transform: "translate(-50%, 0)"}}> Loading book...</div>;
		} 
		// If it failed to load, provide some feedback.
		else if(book.getSpecification() === null) {
			return <Unknown message={
					<div>
						<p>Wasn't able to load the book. Here are the errors we found:</p>
						<ul>
							{ book.getErrors().map((error, index) => <li key={index} className="alert alert-danger">{error}</li>)}
						</ul>
					</div>
				} app={this} />;
		}
		// Render the book
		else {
			return (
				// Bootstrap container with a single row and one big column.
				<div className="container book">
					<div className="row">
						<div className="col-md-12">
							<Switch>
								<Route exact path="/" render={(props) => <TableOfContents {...props} app={this} />} />
								{
									// Map all the book chapters to routes
									book.getChapters().map((chapter, index) => {
										return <Route key={"chapter" + index} path={"/" + chapter.id + "/:word?/:number?"} render={(props) => <Chapter {...props} id={chapter.id} app={this} />} />
									})
								}
								<Route path="/references" render={(props) => <References {...props} app={this} />} />
								<Route path="/glossary" render={(props) => <Glossary {...props} app={this} />} />
								<Route path="/index/:letter?" render={(props) => <Index {...props} app={this} />} />
								<Route path="/search/" render={(props) => <Search {...props} app={this} />} />
								<Route path="*" render={(props) => <Unknown {...props} message={<p>This URL doesn't exist for this book. Want to go back to the <Link to="/">Table of Contents?</Link></p>} app={this} />}/>
							</Switch>
						</div>
					</div>
				</div>
			);
		}
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