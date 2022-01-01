import React from 'react'
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import Book from './views/page/Book'

// Install the mounting function.
window.bookish = function(root) {
	ReactDOM.render(
		<BrowserRouter basename={root}>
			<Book base={root} />
		</BrowserRouter>, 
		document.body.appendChild(document.createElement("div"))
	)
}