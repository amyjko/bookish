import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import Edition from '../src/views/page/Edition'
import Loading from "../src/views/page/Loading";
import loadBookFromURL from "../src/models/BookLoader"

import "../src/assets/css/bookish.css";

const rootNode = document.createElement("div");
document.body.appendChild(rootNode);

// Show some loading feedback while loading
const root = ReactDOM.createRoot(rootNode);

// Render loading
root.render(<Loading/>);

let baseURL = (new URL(document.baseURI)).pathname;

// Load the book
loadBookFromURL(baseURL)
	// If we were successful, render the book!
	.then(book => {
		root.render(
			<BrowserRouter basename={baseURL}>
				<Edition edition={book} />
			</BrowserRouter>
		)
	})
	// If not, show an error.
	.catch(err => {
		console.error(err)
		root.render(
			<div>
				<h1>Oh noes.</h1>
				<p className="bookish-error">Unable to load the book. Here's the potentially cryptic reason:</p>
				<code>{"" + err}</code>
			</div>
		)			
	});