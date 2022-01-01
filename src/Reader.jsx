import React from 'react'
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import Book from './views/page/Book'
import Loading from "./views/page/Loading";
import loadBookFromURL from "./models/BookLoader"

// Install the mounting function.
window.bookish = function(base) {

	const root = document.createElement("div")
	document.body.appendChild(root)

	// Show some loading feedback while loading
	ReactDOM.render(<Loading/>, root)

	// Load the book
	loadBookFromURL(base ? base : "")
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
			const span = document.createElement("span")
			span.classList.addClass("bookish-error")
			span.innerText = `Oh my, we couldn't load the book. Here's why: ${err}`
			document.body.appendChild(span)
		})

}