import React, { useState, useEffect }  from 'react';
import { Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import { BookSaveStatus } from '../../models/book/Edition';
import Chapter from "../chapter/Chapter";
import TableOfContents from "./TableOfContents";
import References from "./References";
import Glossary from "./Glossary"
import Index from "./Index";
import Search from "./Search";
import Media from "./Media";
import Unknown from "./Unknown";
import Print from "./Print"
import { Theme as ThemeType } from "../../models/book/Theme"
import EditionModel from "../../models/book/Edition"

import smoothscroll from 'smoothscroll-polyfill';
import Theme from './Theme';
import Book from '../../models/book/Book';

// Poly fill smooth scrolling for Safari.
smoothscroll.polyfill();

export const DarkModeContext = React.createContext<{ darkMode: boolean, setDarkMode: Function | undefined }>({ darkMode: false, setDarkMode: undefined})
export const BaseContext = React.createContext<{ base: string }>({ base: "" })
export const EditorContext = React.createContext<{ 
	edition: EditionModel | undefined,
	editable: boolean }>({ edition: undefined, editable: false })

const Edition = (props: { edition: EditionModel, base?: string, editable?: boolean }) => {

	const { edition } = props
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
	document.title = edition.getTitle();

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
		edition.getBook()?.addListener(bookChange);
		edition.addListener(bookChange)
		return () => { 
			edition.removeListener(bookChange) 
			edition.getBook()?.removeListener(bookChange);
		}
	}, [edition])

	// When dark mode changes, update dark mode.
	useEffect(updateDarkMode, [ darkMode ])

	// Set the theme, whatever it is.
	setTheme(edition.getTheme());

	// Render the book
	return <div className={"bookish"  + (darkMode ? " bookish-dark" : "")}>
		<DarkModeContext.Provider value={{ darkMode, setDarkMode}}>
		<BaseContext.Provider value={{ base }}>
		<EditorContext.Provider value={{ edition: edition, editable: props.editable ? true : false }}>
			<Routes>
				<Route path="/" element={<TableOfContents edition={edition}/>} />
				{
					// Map all the book chapters to a bare route
					edition.getChapters().map(chapter => {
						return <Route 
								key={"chapter-route-" + chapter.getChapterID()} 
								path={"/" + chapter.getChapterID()} 
								element={<Chapter key={"chapter-" + chapter.getChapterID()} chapter={chapter} book={edition} />} />
					})
				}
				{
					// Map all the book chapters a route with word and number to highlight
					edition.getChapters().map(chapter => {
						return <Route 
								key={"chapter-route-" + chapter.getChapterID() + "-highlighted"}
								path={chapter.getChapterID() + "/:word/:number"}
								element={<Chapter key={"chapter-" + chapter.getChapterID() + "-highlighted"} chapter={chapter} book={edition} />} />
					})
				}
				<Route path="references" element={<References book={edition} />} />
				<Route path="glossary" element={<Glossary book={edition} />} />
				<Route path="index" element={<Index book={edition} />} />
				<Route path="index/:letter" element={<Index book={edition} />} />
				<Route path="search" element={<Search book={edition} />} />
				<Route path="media" element={<Media edition={edition} />} />
				<Route path="theme" element={<Theme book={edition} />} />
				<Route path="print" element={<Print book={edition} />} />
				<Route path="*" element={<Unknown message="This page doesn't exist." book={edition} />}/>
			</Routes>
			<BookStatus book={edition.getBook()} edition={edition}/>
		</EditorContext.Provider>
		</BaseContext.Provider>
		</DarkModeContext.Provider>
	</div>
	
}

const BookStatus = (props: { book: Book | undefined, edition: EditionModel }) => {

	const [ status, setStatus ] = useState<BookSaveStatus>(BookSaveStatus.Saved);

	function handleBookChange(status: BookSaveStatus) {
		setStatus(status);
	}

	// Listen to book and chapter changes.
	useEffect(() => {

		props.book?.addListener(status => handleBookChange(status));
		props.edition.addListener((status) => handleBookChange(status));
		return () => { 
			props.book?.removeListener(handleBookChange);
			props.edition.removeListener(handleBookChange); 
		}
	}, []);

	return <div className={`bookish-editor-status ${status === BookSaveStatus.Saving ? "bookish-editor-status-saving" : status === BookSaveStatus.Error ? "bookish-editor-status-error" : ""}`}>
		{
			status === BookSaveStatus.Changed ? "\u270E Editing" :
			status === BookSaveStatus.Saving ? "\u2026 Saving" :
			status === BookSaveStatus.Saved ? "\u2713 Saved" :
			status === BookSaveStatus.Error ? "\u2715 Couldn't save." :
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

export default Edition