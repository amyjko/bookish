import React, { useContext } from 'react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import Parser, { ChapterNode } from "../../models/Parser"
import Header from '../page/Header'
import Authors from "./Authors"
import Outline from '../page/Outline'
import Page from '../page/Page'

import smoothlyScrollElementToEyeLevel from '../util/Scroll'
import { renderNode } from './Renderer'
import Marker from "../svg/marker.svg"
import Book from '../../models/Book'
import ChapterModel from '../../models/Chapter'
import { EditorContext } from '../page/Book';
import TextEditor from '../editor/TextEditor';

export type ChapterContextType = {
	book?: Book, 
	chapter?: ChapterNode, 
	highlightedWord?: string,
	highlightedID?: string,
	marginalID?: string,
	setMarginal?: Function
}

export const ChapterContext = React.createContext<ChapterContextType>({})

const Chapter = (props: { chapter: ChapterModel, book: Book, print?: boolean }) => {

	// Keep track of the scroll position to facilitate reading during reloads.
	const rememberPosition = () => localStorage.setItem('scrollposition', "" + window.scrollY)

	// When the window resizes, the responsive layout might cause the marginals to move to the footer.
	// when this happens, we want to immediately remove all of the explicit positioning.
	const handleResize = () => layoutMarginals()
	
	// The currently selected marginal; we only do one at a time.
	let [ marginal, setMarginal ] = useState<string | undefined>(undefined)

	// Keep track of which hash mark is scrolled to
	let [ highlightedID, setHighlightedID ] = useState<string | undefined>(undefined)

	const { editable } = useContext(EditorContext)
	const navigate = useNavigate()
	
	// When this component is mounted...
	// 1) Subscribe and unsubscribe to window listeners
	// 2) Do initial layout of marginals
	// 3) Start observing any elements corresponding to the ID in the URL's hash string
	// 4) Clean up our mess after unmounting.
	useEffect(() => {

		// On render or when scrolling, see if the URL hash has changed and update state accordingly.
		// We also track whether we've scrolled to it.
		const observeHash = () => {

			// Get the ID without the hash and the corresponding element
			const elementID = window.location.hash.substring(1)
			const element = elementID ? document.getElementById(elementID) : null

			// If it's not empty, observe it, and remember what we're observing for highlighting
			if(element) {
				setHighlightedID(elementID)
				// Start watching this a few seconds after we see it, giving the for in-page scrolling.
				setTimeout(() => observer.observe(element), 2500)
			}
			
		}

		// Do things to do when scrolling
		const handleScroll = () => {

			// See if the outline is obscured by an image
			hideOutlineIfObscured()

			// See if there are any new hashes to observe. This is because
			// we're using react-router-hash-link, which doesn't trigger hashchange events for some reason.
			observeHash()
			
		}

		// Lay things out when the window or scroll changes.
		window.addEventListener('scroll', handleScroll)
		window.addEventListener('resize', handleResize)

		// Remember the scroll position before a refresh.
		// We have to do all of these because browser support varies.
		window.addEventListener("beforeunload", rememberPosition)
		window.addEventListener("visibilitychange", rememberPosition)
		window.addEventListener("pagehide", rememberPosition)
		
		// Start listening for hash changes, since we want to remove them upon scrolling away from them.
		window.addEventListener("pushstate", observeHash)
		window.addEventListener("popstate", observeHash)
		window.addEventListener("hashchange", observeHash)

		// Make an intersection observer to monitor the location of elements selected by the URL hash ID.
		const observer = new IntersectionObserver((entries => {
			// Go through all of the monitored elements
			entries.forEach(entry => {
				// If the observed element is out of view and in the hash, remove the hash 
				if(entry.intersectionRatio === 0 && entry.target.id === window.location.hash.substring(1)) {
					history.pushState("", document.title, window.location.pathname + window.location.search)
					observer.unobserve(entry.target)					
					setHighlightedID(undefined)
				}
			})
		}))
		
		// Do an initial check the hash to see if there's an ID to scroll to
		observeHash()

		// Position the marginals, since there's new content.
		layoutMarginals()

		// On cleanup, unsubscribe from everything above.
		return () => {

			window.removeEventListener('scroll', handleScroll)
			window.removeEventListener('resize', handleResize)
	
			// Stop listening to page visibility changes.
			window.removeEventListener("beforeunload", rememberPosition)
			window.removeEventListener("visibilitychange", rememberPosition)
			window.removeEventListener("pagehide", rememberPosition)
	
			// Delete the remembered position so that the next page scrolls to top.
			localStorage.removeItem("scrollposition")

			// Stop listening for hash changes
			window.removeEventListener("pushstate", observeHash)
			window.removeEventListener("popstate", observeHash)
			window.removeEventListener("hashchange", observeHash)

			// Stop observing everything on unmount
			observer.disconnect()
		}

	}, [])
	
	// Position the marginals on each render.
	useEffect(() => {
		layoutMarginals();
	})

	// Get the word and number to highlight from the URL
	const { word, number } = useParams()

	// This gets called after the page is done loading. There are various things we scroll to.
	const scrollToLastLocation = () => {

		// In case loading changed marginal positions
		layoutMarginals()

		// If there's a word we're trying to highlight in the URL path, scroll to the corresponding match.
		if(word && number) {
			const highlights = document.getElementsByClassName("bookish-text bookish-content-highlight")
			const num = parseInt(number)
			if(highlights.length > 0 && num < highlights.length && num >= 0) {
				smoothlyScrollElementToEyeLevel(highlights[num])
			}
		}
		// Otherwise, if there's an ID in the URL, jump to it.
		else if(highlightedID) {
			const el = document.getElementById(highlightedID as string)
			// If we found the element, remove the hash any time after a few seconds. See handleScroll for the removal logic.
			if(el) {
				smoothlyScrollElementToEyeLevel(el)
			}
		}
		// Otherwise, scroll to the last scroll position, if there is one.
		else {
			// Scroll to the previous position, if there was one, so that refresh preserves position.
			let scrollPosition = localStorage.getItem('scrollposition');
			window.scrollTo(0, scrollPosition === null ? 0 : parseInt(scrollPosition));
		}

	}

	// Prepare to render the chapter by getting some data from the chapter and book.
	const book = props.book;
	const chapter = props.chapter;
	const chapterID = chapter.getID();
	const chapterNumber = book.getChapterNumber(chapterID);
	const chapterSection = book.getChapterSection(chapterID);
	const chapterAST = chapter.getAST();
	const citations = chapterAST ? chapterAST.getCitations() : undefined;
	const hasReferences = citations && Object.keys(citations).length > 0;

	return (
		<Page afterLoaded={scrollToLastLocation}>
			<div className="bookish-chapter">
				<Header 
					book={book}
					label="Chapter title"
					image={chapter.getImage()}
					print={props.print}
					outline=
					{
						props.print ? 
						null :
						<Outline
							previous={book.getPreviousChapterID(chapterID)}
							next={book.getNextChapterID(chapterID)}
							listener={ (expanded: boolean, callback: Function) =>{
	
								// If the outline is being expanded, hide the marginal, otherwise leave it alone.
								if(expanded)
									setMarginal(undefined)
	
								// Check if we need to hide the outline after positioning.
								hideOutlineIfObscured();
	
							}}
							// Collapse the outline if a marginal is selected.
							collapse={marginal !== undefined}
						/>
					}
					before={
						<span>
						{/* Add an editable chapter ID if in editor mode */}
						{
							editable ?
								<span className="bookish-muted">
									<TextEditor 
										text={props.chapter.getID()} 
										label="Chapter URL ID editor"
										save={ id => props.chapter.setID(id).then(() => navigate(`/write/${props.book.getBookID()}/${id}`)) }
										validationError={(newChapterID) => 
											!/^[a-zA-Z0-9]+$/.test(newChapterID) ? "Chapter IDs must be one or more letters or numbers" :
											props.chapter.getID() !== newChapterID && props.book.hasChapter(newChapterID) ? "There's already a chapter that has this ID." :
											undefined
										}
									>
										{props.chapter.getID()}
									</TextEditor>
									<br/>
								</span>
								:
								null
						}
						{
							chapterNumber === undefined ? 
								null : 
								<span className="bookish-chapter-number">Chapter {chapterNumber}</span> 
						}
						{ 
							chapterSection === null ? 
								null : 
								<span className="bookish-section-name">&nbsp;&nbsp;{chapterSection}</span>
						}
						</span>						
					}
					header={chapter.getTitle()}
					tags={book.getTags()}
					/* If there are chapter authors, map them to authors declared in the book title, otherwise use all the authors of the book */
					after={
						<Authors 
							authors={ chapter.getAuthors() && chapter.getAuthors().length > 0 ? chapter.getAuthors() : book.getAuthors() }
							add={ () => chapter.addAuthor("Author") }
							edit={(index, text) => text.length === 0 ? chapter.removeAuthor(index) : chapter.setAuthor(index, text) }
						/>
					}
					save={ text => props.chapter.setTitle(text) }
				/>
				<Marker/>
				{ /* Render the chapter body, passing some context */ }
				<ChapterContext.Provider 
					value={{
							book: book, 
							chapter: chapter.getAST(), 
							highlightedWord: word,
							highlightedID: highlightedID,
							marginalID: marginal,
							setMarginal: setMarginal
					}}
				>
				{
					chapterAST ? 
						renderNode(chapterAST) :
						null
				}
				</ChapterContext.Provider>
				{
					!hasReferences ? null :
					<div>
						<h1 id="references" className="bookish-header">References</h1>

						<ol>
						{
							Object.keys(citations).sort().map(citationID => {
								let refs = book.getReferences();
								if(citationID in refs) {
									let ref = refs[citationID];
									return <li key={"citation-" + citationID} className={"bookish-reference"} id={"ref-" + citationID}>
										{ renderNode(Parser.parseReference(ref, book)) }
									</li>

								}
								else {
									return <li className="bookish-error" key={"citation-" + citationID}>Unknown reference: <code>{citationID}</code></li>;
								}
							})
						}
						</ol>
					</div>
				}
			</div>
		</Page>
	)

}

// Hides the outline if there's a left inset marginal that might overlap it.
// This operates on the DOM directly, as scroll position isn't easily managed in React.
function hideOutlineIfObscured() {

	// Get the outline's bounds.
	let outline = document.getElementsByClassName("bookish-outline")[0] as HTMLElement;

	// If there's no outline, don't bother.
	if(!outline)
		return

	// Set a threshold for hiding
	let threshold = 100;

	// If the outline isn't affixed to the footer
	if(window.getComputedStyle(outline).getPropertyValue("left") !== "0px") {

		let outlineRect = outline.getBoundingClientRect();
		let overlapRect: DOMRect | undefined = undefined;

		// Find the bottom-most left inset marginal within threshold of the outline.
		Array.from(document.getElementsByClassName("bookish-marginal-left-inset")).forEach(el => {
			let insetRect: DOMRect = el.getBoundingClientRect();
			if(!(outlineRect.bottom < insetRect.top - threshold || 
				outlineRect.top > insetRect.bottom + threshold))
				overlapRect = insetRect;
		});

		// If it overlaps, reduce opacity by the proportion of the vertical distance between two rectangles and the height of the marginal.
		if(overlapRect) {
			let overlap: DOMRect = overlapRect
			let distance = 
				outlineRect.bottom < overlap.top ? threshold :
				outlineRect.bottom < overlap.top + threshold ? threshold - (outlineRect.bottom - overlap.top) :
				outlineRect.top > overlap.bottom - threshold ? threshold - (overlap.bottom - outlineRect.top) :
				outlineRect.top > overlap.bottom ? threshold :
				0;
			let proportion = distance / threshold;
			outline.style.opacity = "" + (proportion * proportion);
		}
		// Otherwise, remove the dimming.
		else
			outline.style.removeProperty("opacity");
	}
	// If it is, it's always visible.
	else
		outline.style.removeProperty("opacity");

}

// After each render of the chapter, we need to adjust the layout of marginals, which by default are floating from
// their little spans within the body of the text. 
//
// We have to do two things:
//
// 1) Lay them out vertically so that they don't overlap.
// 2) Lay them out horizontally, so they're all left aligned with each other on the right margin of the text.
//
// We only want to do this if the marginals are floating; we exclude any marginals that are
// fixed in a fixed position.
function layoutMarginals() {

	// Get the chapter DOM node, so we can calculate margins.
	let chapter = document.getElementsByClassName("bookish-chapter-body")[0] as HTMLElement;

	// If there's no chapter rendered yet, stop.
	if(chapter === undefined)
		return;

	let book = document.getElementsByClassName("bookish")[0] as HTMLElement;

	// This is the grid line we'll aline all marginals too horizontally.
	let margin = chapter.getBoundingClientRect().width;

	// This will track the current leading bottom edge for laying out marginals.
	let currentBottom: number | null = null;

	// Are there any marginal right inset images that might overlap?
	let rightInsets = document.getElementsByClassName("bookish-marginal-right-inset");

	const marginals = document.getElementsByClassName("bookish-marginal")

	// Layout all of the marginals vertically to prevent overlaps.
	Array.from(marginals).forEach((element: Element) => {

		const el = element as HTMLElement;

		if(el === null)
			return;

		if(window.getComputedStyle(el).getPropertyValue("position") !== "fixed") {

			if(el.parentElement) {

				let containingMarginal = el.parentElement.closest(".bookish-marginal");

				// Get the bounds of this marginal so we know it's size.
				let elementBounds = el.getBoundingClientRect();

				// Get the bounds of this marginal's parent so we know it's vertical position.
				let parentBounds = el.parentElement.getBoundingClientRect();
				let parentTop = parentBounds.top + window.scrollY - (book.getBoundingClientRect().top + window.scrollY);

				// If it's inside a marginal, position it below the marginal.
				if(containingMarginal !== null && currentBottom) {
					el.style.left = "0";
					el.style.top = "" + (currentBottom - (containingMarginal.getBoundingClientRect().top + window.scrollY)) + "px";
					currentBottom = currentBottom + elementBounds.height;
				}
				else {
					// If we don't have a bottom yet, or the current above is above the parent's top,
					// then set the current bottom to the bottom of the parent.
					if(currentBottom === null || currentBottom < parentTop) {
						el.style.top = parentTop + "px";
						currentBottom = parentTop + elementBounds.height;
					}
					// Otherwise, put the marginal below the last marginal's bottom.
					else {
						el.style.top = currentBottom + "px";
						currentBottom = currentBottom + elementBounds.height;
					}

					// If there are any right insets, do any intersect with this marginal?
					// If so, move the marginal below them.
					if(rightInsets.length > 0) {
						Array.from(rightInsets).forEach(inset => {
							// Compute the global positions of the marginal and the potential inset.
							let insetBounds = inset.getBoundingClientRect();
							let insetTop = insetBounds.top + window.scrollY;
							let insetBottom = insetTop + insetBounds.height;
							let elementTop = el.getBoundingClientRect().top + window.scrollY;
							let elementBottom = elementTop + elementBounds.height;

							// If they overlap...
							if(currentBottom !== null) {
								if((elementTop <= insetTop && elementBottom >= insetTop) ||
									(elementTop <= insetBottom && elementBottom >= insetBottom) ||
									(elementTop >= insetTop && elementBottom <= insetBottom)) {
									// Calculate the new position based on the preferred position, minus the element's height (which was added above), plus the overlap between the inset and the marginal.
									let newTop = currentBottom - elementBounds.height + (insetBottom - elementTop);
									// Reposition the marginal.
									el.style.top = newTop + "px";
									// Update the new bottom.
									currentBottom = newTop + elementBounds.height;

								}
							}
						});
					}

					// Reposition the marginal horizontally.
					el.style.left = "calc(2rem + " + margin + "px)";
				}

			}

		}
		// If it's fixed, remove any explicitly set inline values.
		else {
			el.style.removeProperty("top");
			el.style.removeProperty("left");
		}
	});
	
}

export default Chapter