import React from 'react';

import { Parser } from "../models/Parser";
import { ChapterHeader } from './ChapterHeader';
import { Authors } from "./Authors";
import { Outline } from './Outline';
import { Page } from './Page';
import { Loading } from './Loading';

import { smoothlyScrollElementToEyeLevel } from './Scroll.js';

class Chapter extends React.Component {

	constructor(props){
		super(props);

		this.handleScroll = this.handleScroll.bind(this);
		this.handleResize = this.handleResize.bind(this);
		this.rememberPosition = this.rememberPosition.bind(this);
		this.scrollToLastLocation = this.scrollToLastLocation.bind(this);

		// Assume the chapter is loaded initially.
		this.state = {
			marginal: null // The currently selected marginal; we only do one at a time.
		};

		// Remember what the hash was before the outline on this page sets it.
		this.currentHash = null;
		this.currentHashScrolled = false;
		this.handleHashChange();

	}

	getApp() { return this.props.app; }
	getBook() { return this.props.app.getBook(); }

	componentDidMount() {
		
		// Lay things out when the window or scroll changes.
		window.addEventListener('scroll', this.handleScroll);
		window.addEventListener('resize', this.handleResize);

		// Remember the scroll position before a refresh.
		// We have to do all of these because browser support varies.
        window.addEventListener("beforeunload", this.rememberPosition);
        window.addEventListener("visibilitychange", this.rememberPosition);
        window.addEventListener("pagehide", this.rememberPosition);

		// Position the marginals, since there's new content.
		this.layoutMarginals();

	}

	componentWillUnmount() {

		window.removeEventListener('scroll', this.handleScroll);
		window.removeEventListener('resize', this.handleResize);

		// Stop listening to page visibility changes.
		window.removeEventListener("beforeunload", this.rememberPosition);
        window.removeEventListener("visibilitychange", this.rememberPosition);
        window.removeEventListener("pagehide", this.rememberPosition);

		// Delete the remembered position so that the next page scrolls to top.
		localStorage.removeItem("scrollposition");

	}

	componentDidUpdate() {

		// Position the marginals, since there's potentially new content.
		this.layoutMarginals();

	}

	rememberPosition() { 

		localStorage.setItem('scrollposition', "" + window.scrollY);

	}

	getProgress() {

		let progress = localStorage.getItem("chapterProgress");
		if(progress === null) {
			progress = {};
		} else {
			progress = JSON.parse(progress);
		}

		// If we don't have an entry for this chapter, treat it as 0.
		progress = (this.props.id in progress) ? progress[this.props.id] : 0;
		
		return progress;

	}

	scrollToLastLocation() {

		// If there's a word we're trying to highlight, scroll to the first match.
		if(this.props.match && this.props.match.params.word) {

			const match = document.getElementsByClassName("text content-highlight");

			const number = this.props.match.params.number && this.props.match.params.number < match.length ? this.props.match.params.number : 0;

			if(match.length > 0)
				smoothlyScrollElementToEyeLevel(match[number]);

		}
		// If there's no word, is there an element ID? If so, jump to it.
		else if(this.currentHash !== null) {
			const el = document.getElementById(this.currentHash);

			// If we found the element, remove the hash any time after a few seconds. See handleScroll for the removal logic.
			if(el) {
				smoothlyScrollElementToEyeLevel(el);
			}

		}
		// If there's no word or hash, scroll to the last scroll position, if there is one.
		else {

			// Scroll to the previous position, if there was one, so that refresh preserves position.
			let scrollPosition = localStorage.getItem('scrollposition');
			if(scrollPosition === null)
				scrollPosition = 0;
			window.scrollTo(0, scrollPosition);

		}

	}

	handleHashChange() {

		let parts = window.location.hash.split("#");
		let id = parts.length > 2 ? parts[2] : null;
		if(this.currentHash !== id) {
			this.currentHash = id;
			this.currentHashScrolled = false;
			setTimeout(() => this.currentHashScrolled = true, 2000);
			console.log("Updated hash to " + this.currentHash);
		}

	}
	
	// When the window resizes, the responsive layout might cause the marginals to move to the footer.
	// when this happens, we want to immediately remove all of the explicit positioning.
	handleResize() {

		this.layoutMarginals();

	}

	handleScroll() {

		// The ground truth location is the bottom of the window. (If we used the top of the window,
		// it wouldn't be possible to get to 100%, which would be very annoying when giving feedback to
		// readers about their progress!
		const top = window.scrollY;
		const height = Math.max(document.body.scrollHeight, document.body.offsetHeight) - window.innerHeight;
		const percent = Math.max(0, Math.round(100 * (top / height)));

		// Remember the progress
		let progress = localStorage.getItem("chapterProgress");
		if(progress === null) {
			progress = {};
		} else {
			progress = JSON.parse(progress);
		}
		progress[this.props.id] = percent;
		localStorage.setItem("chapterProgress", JSON.stringify(progress));

		// Handle overlaps
		this.hideOutlineIfObscured();

		// See if the hash has changed.
		this.handleHashChange();

		// If there was a hash and it's still there and the target is no longer in view, remove the hash from the URL so that refreshes go to the current position, not the hash.
		if(this.currentHash !== null && this.currentHashScrolled) {
			const el = document.getElementById(this.currentHash);
			const rect = el.getBoundingClientRect();
			// If it's outside the window, remove the hash.
			if(rect.bottom < 0 || rect.top > window.innerHeight) {
				const url = new URL(document.location.href);
				url.hash = "#" + window.location.hash.split("#")[1];
				history.pushState({}, "", url.pathname + url.hash);
				this.currentHash = null;
				this.currentHashScrolled = false;
			}
		}
		
	}

	hideOutlineIfObscured() {

		// Get the outline's bounds.
		let outline = document.getElementsByClassName("outline")[0];

		// If there's no outline, don't bother.
		if(!outline)
			return

		// Set a threshold for hiding
		let threshold = 100;

		// If the outline isn't affixed to the footer
		if(window.getComputedStyle(outline).getPropertyValue("left") !== "0px") {

			let outlineRect = outline.getBoundingClientRect();
			let overlapRect = null;

			// Find the bottom-most left inset marginal within threshold of the outline.
			Array.from(document.getElementsByClassName("marginal-left-inset")).forEach(el => {
				let insetRect = el.getBoundingClientRect();
				if(!(outlineRect.bottom < insetRect.top - threshold || 
					outlineRect.top > insetRect.bottom + threshold))
					overlapRect = insetRect;
			});

			// If it overlaps, reduce opacity by the proportion of the vertical distance between two rectangles and the height of the marginal.
			if(overlapRect) {
				let distance = 
					outlineRect.bottom < overlapRect.top ? threshold :
					outlineRect.bottom < overlapRect.top + threshold ? threshold - (outlineRect.bottom - overlapRect.top) :
					outlineRect.top > overlapRect.bottom - threshold ? threshold - (overlapRect.bottom - outlineRect.top) :
					outlineRect.top > overlapRect.bottom ? threshold :
					0;
				let proportion = distance / threshold;
				outline.style.opacity = proportion * proportion;
			}
			// Otherwise, remove the dimming.
			else
				outline.style.removeProperty("opacity");
		}
		// If it is, it's always visible.
		else
			outline.style.removeProperty("opacity");

	}

	removeHighlights() {

		// Which text node is closest?
		document.getElementsByClassName("content-highlight").forEach(highlight => highlight.classList.remove("content-highlight"));
		
	}

	getMarginal() {
		return this.state.marginal;
	}

	setMarginal(marginal) {

		// If the marginal is being shown, hide the outline, otherwise leave it alone.
		this.setState({ 
			marginal: marginal
		});

	}

	getHighlightedWord() { return this.props.match ? this.props.match.params.word : null; }

	getHighlightedID() { return this.currentHash; }

	// After each render, we need to adjust the layout of marginals, which by default are floating from
	// their little spans within the body of the text. We have to do two things:
	//
	// 1) Lay them out vertically so that they don't overlap.
	// 2) Lay them out horizontally, so they're all left aligned with each other on the right margin of the text.
	//
	// We only want to do this if the marginals are floating; we exclude any marginals that are
	// fixed in a fixed position.
	layoutMarginals() {

		// Get the chapter DOM node, so we can calculate margins.
		let chapter = document.getElementsByClassName("chapter-body")[0];

		// If there's no chapter rendered yet, stop.
		if(chapter === undefined)
			return;

		let book = document.getElementsByClassName("book")[0];

		// This is the grid line we'll aline all marginals too horizontally.
		let margin = chapter.getBoundingClientRect().width;

		// This will track the current leading bottom edge for laying out marginals.
		let currentBottom = null;

		// Are there any marginal right inset images that might overlap?
		let rightInsets = document.getElementsByClassName("marginal-right-inset");

		// Layout all of the marginals vertically to prevent overlaps.
		Array.from(document.getElementsByClassName("marginal")).forEach(el => {
			if(window.getComputedStyle(el).getPropertyValue("position") !== "fixed") {

				let containingMarginal = el.parentElement.closest(".marginal");
				let inMarginal = containingMarginal !== null;

				// Get the bounds of this marginal so we know it's size.
				let elementBounds = el.getBoundingClientRect();

				// Get the bounds of this marginal's parent so we know it's vertical position.
				let parentBounds = el.parentElement.getBoundingClientRect();
				let parentTop = parentBounds.top + window.scrollY - (book.getBoundingClientRect().top + window.scrollY);

				// If it's inside a marginal, position it below the marginal.
				if(inMarginal) {
					el.style.left = 0;
					el.style.top = (currentBottom - (containingMarginal.getBoundingClientRect().top + window.scrollY)) + "px";
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
						});
					}

					// Reposition the marginal horizontally.
					el.style.left = "calc(2rem + " + margin + "px)";
				}
				
			}
			// If it's fixed, remove any explicitly set inline values.
			else {
				el.style.removeProperty("top");
				el.style.removeProperty("left");
			}
		});
		
	}

	render() {

		let book = this.props.app.getBook();

		// Figure out if there's something to highlight.
		let citationHighlight = null;
		const highlight = window.location.hash.split("#")[2];
		if(highlight) {
			let parts = highlight.split("-");
			let kind = parts[0];
			let id = parts[1];
			if(kind === "ref")
				citationHighlight = id;
			else if(kind == "note")
				noteHighlight = parseInt(id);
		}

		if(!book.chapterIsLoaded(this.props.id)) {
			return this.props.print ? null : <Loading/>;
		}
		else {

			let chapter = book.getChapter(this.props.id);
			let chapterNumber = book.getChapterNumber(this.props.id);
			let chapterSection = book.getChapterSection(this.props.id);
			let citations = chapter.getAST().getCitations();
			let hasReferences = Object.keys(citations).length > 0;
			
			return (
				<Page loaded={this.scrollToLastLocation}>
					<div className="chapter">
						<ChapterHeader 
							book={book}
							image={chapter.image}
							print={this.props.print}
							before={
								<span>
								{
									chapterNumber === undefined ? 
										null : 
										<span className="chapter-number">Chapter {chapterNumber}</span> 
								}
								{ 
									chapterSection === null ? 
										null : 
										<span className="section-name"> {chapterSection}</span>
								}
								{ 
									chapterNumber || chapterSection ? 
										<br/> : 
										null 
								}
								</span>						
							}
							header={chapter.title}
							tags={book.getTags()}
							/* If there are chapter authors, map them to authors declared in the book title, otherwise use all the authors of the book */
							after={
								<Authors authors={
										chapter.authors ? 
											chapter.authors.map(author => book.getAuthorByID(author)) : 
											book.getAuthors()} 
								/>
							} 
						/>

						{
							this.props.print ? 
							null :
							<Outline
								previous={book.getPreviousChapterID(this.props.id)}
								next={book.getNextChapterID(this.props.id)}
								listener={ (expanded, callback) =>{
									// If the outline is being expanded, hide the marginal, otherwise leave it alone.
									this.setState({ 
										marginal: expanded ? null : this.state.marginal 
									}, callback);

									// Check if we need to hide the outline after positioning.
									this.hideOutlineIfObscured();

								}}
								// Collapse the outline if a marginal is selected.
								collapse={this.state.marginal !== null}
							/>
						}

						{/* Render the chapter body */}
						<div>
						{
							chapter.getAST().toDOM(this, this.props.match ? this.props.match.params.word : null)
						}
						</div>
						{
							!hasReferences ? null :
							<div>
								<h1 id="references" className="header">References</h1>

								<ol>
								{
									Object.keys(citations).sort().map(citationID => {
										let refs = book.getReferences();
										if(citationID in refs) {
											let ref = refs[citationID];
											return <li key={"citation-" + citationID} className={citationID === citationHighlight ? "reference content-highlight" : "reference"} id={"ref-" + citationID}>
												{Parser.parseReference(ref, book)}
											</li>

										}
										else {
											return <li className="alert alert-danger" key={"citation-" + citationID}>Unknown reference: <code>{citationID}</code></li>;
										}
									})
								}
								</ol>
							</div>
						}
					</div>
				</Page>
			);
		}

	}

}

export { Chapter };