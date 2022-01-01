import React from 'react';
import { Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';

import Chapter from "../chapter/Chapter";
import TableOfContents from "./TableOfContents";
import References from "./References";
import Glossary from "./Glossary"
import Index from "./Index";
import Search from "./Search";
import Media from "./Media";
import Unknown from "./Unknown";
import Loading from "./Loading";
import Print from "./Print"

import { loadBookFromURL } from "../../models/BookLoader"

import smoothscroll from 'smoothscroll-polyfill';

// Poly fill smooth scrolling for Safari.
smoothscroll.polyfill();

export default function Book(props) {

	const [ book, setBook ] = useState(null)
	const [ error, setError ] = useState(null)

	const location = useLocation()

	// Redirect old hash routes by simply replacing their hash before routing.
	const navigate = useNavigate()
	if(location.hash.startsWith('#/'))
		navigate(location.hash.replace('#', ''))
	
	useEffect(() => {
		
		// Load the book
		loadBookFromURL(props.base ? props.base : "")
			.then(book => setBook(book))
			.catch(err => setError(err))

	}, [])

	// If there's an error, show the error.
	if(error) {
		return <div>
			<p>Wasn't able to load the book. Here are the errors we found:</p>
			<p className="bookish-error">{error.message}</p>
		</div>
	}
	// If the book isn't loaded yet, show loading feedback
	else if(!book) {
		return <Loading/>;
	} 
	// Render the loaded book
	else {

		// Set the window title based on the specification.
		document.title = book.getTitle();

		// Render the book
		return <div className="bookish">
			<Routes>
				<Route exact path="/" element={<TableOfContents book={book} />} />
				{
					// Map all the book chapters to a bare route
					book.getChapters().map((chapter, index) => {
						return <Route 
								key={"chapter-route-" + chapter.getID()} 
								path={"/" + chapter.getID()} 
								element={<Chapter key={"chapter-" + chapter.getID()} chapter={chapter} book={book} />} />
					})
				}
				{
					// Map all the book chapters a route with word and number to highlight
					book.getChapters().map((chapter, index) => {
						return <Route 
								key={"chapter-route-" + chapter.getID() + "-highlighted"}
								path={"/" + chapter.getID() + "/:word/:number"}
								element={<Chapter key={"chapter-" + chapter.getID() + "-highlighted"} chapter={chapter} book={book} />} />
					})
				}
				<Route path="/references" element={<References book={book} />} />
				<Route path="/glossary" element={<Glossary book={book} />} />
				<Route path="/index" element={<Index book={book} />} />
				<Route path="/index/:letter" element={<Index book={book} />} />
				<Route path="/search" element={<Search book={book} />} />
				<Route path="/media" element={<Media book={book} />} />
				<Route path="/print" element={<Print book={book} />} />
				<Route path="*" element={<Unknown message={<p>The path {location.pathname} doesn't exist for this book.</p>} book={book} />}/>
			</Routes>
		</div>
	
	}
	
}