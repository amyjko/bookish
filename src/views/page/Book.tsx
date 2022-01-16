import React, { useState, useEffect }  from 'react';
import { Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import Chapter from "../chapter/Chapter";
import TableOfContents from "./TableOfContents";
import References from "./References";
import Glossary from "./Glossary"
import Index from "./Index";
import Search from "./Search";
import Media from "./Media";
import Unknown from "./Unknown";
import Print from "./Print"
import BookModel from "../../models/Book"

import smoothscroll from 'smoothscroll-polyfill';

// Poly fill smooth scrolling for Safari.
smoothscroll.polyfill();

export const DarkModeContext = React.createContext<{ darkMode: boolean, setDarkMode: Function | undefined }>({ darkMode: false, setDarkMode: undefined})
export const BaseContext = React.createContext<{ base: string }>({ base: "" })
export const EditorContext = React.createContext<{ editable: boolean, setEditingBook: Function | undefined }>({ editable: false, setEditingBook: undefined })

const Book = (props: { book: BookModel, base?: string, editable?: boolean }) => {

	const { book } = props
	const location = useLocation()
	const [ editingBook, setEditingBook ] = useState(false)

	// The base path allows links to adjust to different routing contexts in which a book is placed.
	// For example, when the book is hosted alone, all routes might start with the bare root "/", 
	// but when the book is being viewed or edited in the Bookish app, it needs a prefix for the
	// route in the app.
	const base: string = props.base ? props.base : ""

	// Default dark mode to whatever's stored in local storage, if anything.
	let [ darkMode, setDarkMode ] = useState(
		localStorage.getItem("bookish-dark") === "true" || // A previous setting
		window.matchMedia("(prefers-color-scheme: dark)").matches // Operating system is set to dark
	)

	// Redirect old hash routes by simply replacing their hash before routing.
	const navigate = useNavigate()
	if(location.hash.startsWith('#/'))
		navigate(location.hash.replace('#', ''))
	
	// Set the window title based on the specification.
	document.title = book.getTitle();

	const updateDarkMode = () => {
		if(darkMode) {
            document.body.classList.add("bookish-dark")
            localStorage.setItem("bookish-dark", "true")
        }
        else {
            document.body.classList.remove("bookish-dark")
            localStorage.setItem("bookish-dark", "false")
        }
	}

	// Update immediately before rendering.
	updateDarkMode()

	// When dark mode changes, update dark mode.
	useEffect(updateDarkMode, [ darkMode ])

	// When editing changes, update the book
	useEffect(() => {}, [ editingBook ])

	// Render the book
	return <div className={"bookish"  + (darkMode ? " bookish-dark" : "")}>
		<DarkModeContext.Provider value={{ darkMode, setDarkMode}}>
		<BaseContext.Provider value={{ base }}>
		<EditorContext.Provider value={{ editable: props.editable ? true : false, setEditingBook }}>
			<Routes>
				<Route path="/" element={<TableOfContents book={book}/>} />
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
								path={chapter.getID() + "/:word/:number"}
								element={<Chapter key={"chapter-" + chapter.getID() + "-highlighted"} chapter={chapter} book={book} />} />
					})
				}
				<Route path="references" element={<References book={book} />} />
				<Route path="glossary" element={<Glossary book={book} />} />
				<Route path="index" element={<Index book={book} />} />
				<Route path="index/:letter" element={<Index book={book} />} />
				<Route path="search" element={<Search book={book} />} />
				<Route path="media" element={<Media book={book} />} />
				<Route path="print" element={<Print book={book} />} />
				<Route path="*" element={<Unknown message={<p>This page doesn't exist.</p>} book={book} />}/>
			</Routes>
		</EditorContext.Provider>
		</BaseContext.Provider>
		</DarkModeContext.Provider>
	</div>
	
}

export default Book