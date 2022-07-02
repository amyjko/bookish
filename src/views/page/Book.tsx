import React, { useState, useEffect }  from 'react';
import { Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import { BookSaveStatus, defaultTheme, ThemeColors } from '../../models/Book';
import Chapter from "../chapter/Chapter";
import TableOfContents from "./TableOfContents";
import References from "./References";
import Glossary from "./Glossary"
import Index from "./Index";
import Search from "./Search";
import Media from "./Media";
import Unknown from "./Unknown";
import Print from "./Print"
import { Theme as ThemeType } from "../../models/Book"
import BookModel from "../../models/Book"

import smoothscroll from 'smoothscroll-polyfill';
import Theme from './Theme';

// Poly fill smooth scrolling for Safari.
smoothscroll.polyfill();

export const DarkModeContext = React.createContext<{ darkMode: boolean, setDarkMode: Function | undefined }>({ darkMode: false, setDarkMode: undefined})
export const BaseContext = React.createContext<{ base: string }>({ base: "" })
export const EditorContext = React.createContext<{ 
	book: BookModel | undefined,
	editable: boolean }>({ book: undefined, editable: false })

const Book = (props: { book: BookModel, base?: string, editable?: boolean }) => {

	const { book } = props
	const location = useLocation()
	const [, updateState] = React.useState<{}>();
	const forceUpdate = React.useCallback(() => updateState({}), []);

	// The base path allows links to adjust to different routing contexts in which a book is placed.
	// For example, when the book is hosted alone, all routes might start with the bare root "/", 
	// but when the book is being viewed or edited in the Bookish app, it needs a prefix for the
	// route in the app.
	const base: string = props.base ? props.base : ""
	
	// Default dark mode to whatever's stored in local storage, if anything.
	// respect user choice on the website despite the system theme
	let [ darkMode, setDarkMode ] = useState(
		localStorage.getItem("bookish-dark") !== "false" && (localStorage.getItem("bookish-dark") === "true" || // A previous setting
		window.matchMedia("(prefers-color-scheme: dark)").matches) // Operating system is set to dark
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

	// Just use a counter to force re-renders on book changes.
	function bookChange() {
		forceUpdate()
	}
	
	// Listen to book changes, stop when unmounted.
	useEffect(() => {
		book.addListener(bookChange)
		return () => { book.removeListener(bookChange) }
	}, [book])

	// When dark mode changes, update dark mode.
	useEffect(updateDarkMode, [ darkMode ])

	// Set the theme, whatever it is.
	setTheme(book.getTheme());

	// Render the book
	return <div className={"bookish"  + (darkMode ? " bookish-dark" : "")}>
		<DarkModeContext.Provider value={{ darkMode, setDarkMode}}>
		<BaseContext.Provider value={{ base }}>
		<EditorContext.Provider value={{ book, editable: props.editable ? true : false }}>
			<Routes>
				<Route path="/" element={<TableOfContents book={book}/>} />
				{
					// Map all the book chapters to a bare route
					book.getChapters().map((chapter, index) => {
						return <Route 
								key={"chapter-route-" + chapter.getChapterID()} 
								path={"/" + chapter.getChapterID()} 
								element={<Chapter key={"chapter-" + chapter.getChapterID()} chapter={chapter} book={book} />} />
					})
				}
				{
					// Map all the book chapters a route with word and number to highlight
					book.getChapters().map((chapter, index) => {
						return <Route 
								key={"chapter-route-" + chapter.getChapterID() + "-highlighted"}
								path={chapter.getChapterID() + "/:word/:number"}
								element={<Chapter key={"chapter-" + chapter.getChapterID() + "-highlighted"} chapter={chapter} book={book} />} />
					})
				}
				<Route path="references" element={<References book={book} />} />
				<Route path="glossary" element={<Glossary book={book} />} />
				<Route path="index" element={<Index book={book} />} />
				<Route path="index/:letter" element={<Index book={book} />} />
				<Route path="search" element={<Search book={book} />} />
				<Route path="media" element={<Media book={book} />} />
				<Route path="theme" element={<Theme book={book} />} />
				<Route path="print" element={<Print book={book} />} />
				<Route path="*" element={<Unknown message="This page doesn't exist." book={book} />}/>
			</Routes>
			<BookStatus book={book}/>
		</EditorContext.Provider>
		</BaseContext.Provider>
		</DarkModeContext.Provider>
	</div>
	
}

const BookStatus = (props: { book: BookModel }) => {

	const [ status, setStatus ] = useState<BookSaveStatus>(BookSaveStatus.Saved);

	function handleBookChange(status: BookSaveStatus) {
		setStatus(status);
	}

	// Listen to book changes.
	useEffect(() => {
		props.book.addListener((status) => handleBookChange(status));
		return () => { props.book.removeListener(handleBookChange); }
	}, []);

	return <div className={`bookish-editor-status ${status === BookSaveStatus.Saving ? "bookish-editor-status-saving" : status === BookSaveStatus.Error ? "bookish-editor-status-error" : ""}`}>
		{
			status === BookSaveStatus.Changed ? "\u2026" :
			status === BookSaveStatus.Saving ? "\u2026" :
			status === BookSaveStatus.Saved ? "\u2713" :
			status === BookSaveStatus.Error ? "\u2715" :
			""
		}
	</div>

}

function setTheme(theme: ThemeType | null) {

	// Remove any existing theme.
	document.getElementById("bookish-theme")?.remove();

	// If the theme is being unset, make sure we've removed any overrding style declaration.
	// This let's the default theme kick in.
	if(theme === null)
		return;

	// If it's being set, create a new style tag.
	const themeTag = document.createElement("style");
	themeTag.setAttribute("id", "bookish-theme");
	const css = `:root {
		${toRules(theme.light)}
		${toRules(theme.fonts)}
		${toRules(theme.sizes)}
		${toRules(theme.weights)}
		${toRules(theme.spacing)}
	}
	.bookish-dark {
		${toRules(theme.dark)}
	}`;
	themeTag.appendChild(document.createTextNode(css));
	document.head.appendChild(themeTag);

}

function toRules(set: Record<string, string>) {
	return Object.keys(set).map(name => {
		const cssVariable = "--bookish-" + name.replace(/([a-z])([A-Z])/g, "$1 $2").split(" ").map(s => s.toLowerCase()).join("-");
		return `${cssVariable}: ${set[name]};`
	}).join("\n\t\t");
}

export default Book