import React from 'react'
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import Book from './views/page/Book'
import Loading from "./views/page/Loading";
import loadBookFromURL from "./models/BookLoader"

// Install the mounting function.
window.bookish = function(base) {

	base = base ? base : "";

	const root = document.createElement("div")
	document.body.appendChild(root)

	// Show some loading feedback while loading
	ReactDOM.render(<Loading/>, root)

	// Load the book
	loadBookFromURL(base)
		// If we were successful, show the book!
		.then(book => {
		ReactDOM.render(
				<BrowserRouter basename={base}>
					<Book base={base} book={book}/>
				</BrowserRouter>,
				root
			)		
		})
		// If not, show an error.
		.catch(err => {
			ReactDOM.render(
				<div>
					<h1>Oh noes.</h1>
					<p className="bookish-error">We couldn't load the book. Here's the potentially cryptic reason:</p>
					<code>{"" + err}</code>
				</div>,
				root
			)			
		})

}