import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter, Route, Switch, withRouter } from 'react-router-dom';

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
		loadBookFromURL(BOOKISH_BASENAME ? BOOKISH_BASENAME : "")
			.then(book => this.setState({ book: book }))
			.catch(error => this.setState({ error: error }))

	}

	layout() {

		this.showScrollReminder();

	}

	showScrollReminder() {

		// Tag things "past-title" if we're past it, so they can react to position.
		let title = document.getElementById("title");
		let reminder = document.getElementById("bookish-scroll-reminder");
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
				<p className="bookish-error">{this.state.error.message}</p>
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

			// Redirect old hash routes by simply replacing their hash before routing.
			const { history } = this.props
			if (location.hash.startsWith('#/'))
				history.push(location.hash.replace('#', ''))

			// Render the book
			return (
				<div className="bookish">
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
						<Route path="*" render={(props) => <Unknown {...props} message={<p>The path {location.pathname} doesn't exist for this book.</p>} app={this} />}/>
					</Switch>
				</div>
			);
		}
	}
	
}
const BookishWithRouter = withRouter(Bookish);

window.bookish = function(root) {
	BOOKISH_BASENAME = root
	ReactDOM.render(
		<BrowserRouter basename={root}>
			<BookishWithRouter/>
		</BrowserRouter>, 
		document.body.appendChild(document.createElement("div"))
	)
}