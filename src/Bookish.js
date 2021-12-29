import React from 'react';
import ReactDOM from 'react-dom';
import { Route, HashRouter, Switch, withRouter } from 'react-router-dom';

import Chapter from "./views/chapter/Chapter";
import TableOfContents from "./views/page/TableOfContents";
import References from "./views/page/References";
import Glossary from "./views/page/Glossary"
import Index from "./views/page/Index";
import Search from "./views/page/Search";
import Media from "./views/page/Media";
import Unknown from "./views/page/Unknown";
import Loading from "./views/page/Loading";
import Print from "./views/page/Print"

import smoothscroll from 'smoothscroll-polyfill';

import { loadBookFromURL } from "./models/BookLoader"

smoothscroll.polyfill();

class Bookish extends React.Component {

	constructor(props) {

		super(props);

		// Bind event handlers
		this.layout = this.layout.bind(this)

		// Setup state
		this.state = {
			// Make a Book instance to load the book. When something loads, update.
			book: null,
			error: null
		}

		// Load the book
		loadBookFromURL(this.props.url)
			.then(book => this.setState({ book: book }))
			.catch(error => this.setState({ error: error }))

	}

	layout() {

		this.showScrollReminder();

	}

	showScrollReminder() {

		// Tag things "past-title" if we're past it, so they can react to position.
		let title = document.getElementById("title");
		let reminder = document.getElementById("scroll-reminder");
		if(title && reminder) {
			if(window.scrollY + window.innerHeight > title.getBoundingClientRect().top + window.scrollY)
				reminder.classList.add("past-title");
			else
				reminder.classList.remove("past-title");
		}

	}

	componentDidMount() {

		window.addEventListener('scroll', this.layout);
		window.addEventListener('resize', this.layout);

	}

	componentWillUnmount() {

		window.removeEventListener('scroll', this.layout);
		window.addEventListener('resize', this.layout);

	}

	componentDidUpdate() {

		this.showScrollReminder();

	}

	getBook() { return this.state.book; }
	
	render() {
		
		// If there's an error, show the error.
		if(this.state.error) {
			return <div>
				<p>Wasn't able to load the book. Here are the errors we found:</p>
				<p className="alert alert-danger">{this.state.error.message}</p>
			</div>
		}
		// If the book isn't loaded yet, show loading feedback
		else if(!this.state.book) {
			return <Loading/>;
		} 
		// Render the loaded book
		else {

			// Set the window title based on the specification.
			document.title = this.state.book.getTitle();

			// Render the book
			return (
				// Bootstrap container with a single row and one big column.
				<div className="container book">
					<div className="row">
						<div className="col-md-12">
							<Switch>
								<Route exact path="/" render={(props) => <TableOfContents {...props} app={this} />} />
								{
									// Map all the book chapters to routes
									this.state.book.getChapters().map((chapter, index) => {
										return <Route key={"chapter" + index} path={"/" + chapter.getID() + "/:word?/:number?"} render={(props) => <Chapter {...props} chapter={chapter} app={this} />} />
									})
								}
								<Route path="/references" render={(props) => <References {...props} app={this} />} />
								<Route path="/glossary" render={(props) => <Glossary {...props} app={this} />} />
								<Route path="/index/:letter?" render={(props) => <Index {...props} app={this} />} />
								<Route path="/search/" render={(props) => <Search {...props} app={this} />} />
								<Route path="/media/" render={(props) => <Media {...props} app={this} />} />
								<Route path="/print/" render={(props) => <Print {...props} app={this} />} />
								<Route path="*" render={(props) => <Unknown {...props} message={<p>This URL doesn't exist for this book.</p>} app={this} />}/>
							</Switch>
						</div>
					</div>
				</div>
			);
		}
	}
	
}

const BookishWithRouter = withRouter(Bookish);

window.bookish = function() {
	ReactDOM.render((
		<HashRouter>
			<Route path="/" render={(props) => <BookishWithRouter {...props} url="./" /> } />
		</HashRouter>
	), document.body.appendChild(document.createElement("div")));
}