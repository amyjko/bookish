import React from 'react';

import { Parser } from "../models/parser";
import { Header } from './header';
import { Authors } from "./authors";
import { Outline } from './outline';

class Chapter extends React.Component {

	constructor(props){
		super(props);

		this.handleScroll = this.handleScroll.bind(this);
		this.handleResize = this.handleResize.bind(this);
		this.handleDoubleClick = this.handleDoubleClick.bind(this);
		this.handleChange = this.handleChange.bind(this);

		// Assume the chapter is loaded initially.
		this.state = { 
			loaded: true, 
			editing: false, 
			draft: null,
			marginal: null // The currently selected marginal; we only do one at a time.
		};

	}

	getApp() { return this.props.app; }
	getBook() { return this.props.app.getBook(); }

	componentDidMount() {

		window.addEventListener('scroll', this.handleScroll);
		window.addEventListener('resize', this.handleResize);

		// If the component renders after the chapter is loaded and rendered, scroll to the last location.
		if(this.props.app.getBook().chapterIsLoaded(this.props.id)) {
			this.scrollToLastLocation();
		}
		// Otherwise, mark it as not loaded.
		else
			this.setState({ loaded: false })

		// Position the marginals, since there's new content.
		this.layoutMarginals();

	}

	componentWillUnmount() {

		window.removeEventListener('scroll', this.handleScroll);
		window.removeEventListener('resize', this.handleResize);

	}

	componentDidUpdate() {

		// If the chapter was rendered, and the chapter wasn't yet loaded, but now it is, scroll to the last location.
		if(!this.state.loaded && this.props.app.getBook().chapterIsLoaded(this.props.id)) {

			// Remember that it was loaded.
			this.setState({ loaded: true});

			this.scrollToLastLocation();
		}

		// Position the marginals, since there's potentially new content.
		this.layoutMarginals();

	}

	getProgress() {

		var progress = localStorage.getItem("chapterProgress");
		if(progress === null) {
			progress = {};
		} else {
			progress = JSON.parse(progress);
		}

		// If we don't have an entry for this chapter, treat it as 0.
		var progress = (this.props.id in progress) ? progress[this.props.id] : 0;
		
		return progress;

	}

	scrollToLastLocation() {

		// Scroll to the first match.
		if(this.props.match.params.word) {

			var match = document.getElementsByClassName("content-highlight");

			var number = this.props.match.params.number && this.props.match.params.number < match.length ? this.props.match.params.number : 0;

			if(match.length > 0)
				match[number].scrollIntoView({
					behavior: "smooth",
					block: "center"
				});

		} 
		else {
		
			// Read the saved position.
			var progress = this.getProgress();
			var position = (progress / 100.0) * (Math.max(document.body.scrollHeight, document.body.offsetHeight) - window.innerHeight);

			// Scroll the window to roughly the same position.
			// This is actually really annoying. Disabling it now that we have better outline navigation,
			// and scrolling to the top instead.
			// window.scrollTo(0, position);
			window.scrollTo(0, 0);

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
		var progress = localStorage.getItem("chapterProgress");
		if(progress === null) {
			progress = {};
		} else {
			progress = JSON.parse(progress);
		}
		progress[this.props.id] = percent;
		localStorage.setItem("chapterProgress", JSON.stringify(progress));

		// Handle overlaps
		this.hideOutlineIfObscured();

	}

	hideOutlineIfObscured() {

		// Get the outline's bounds.
		let outline = document.getElementsByClassName("outline")[0];

		// If the outline isn't affixed to the footer
		if(window.getComputedStyle(outline).getPropertyValue("left") !== "0px") {

			let outlineRect = outline.getBoundingClientRect();
			let overlap = null;

			// Find any marginal left inset things and hide the outline if they're colliding.
			Array.from(document.getElementsByClassName("marginal-left-inset")).forEach(el => {
				let insetRect = el.getBoundingClientRect();
				if(!(outlineRect.right < insetRect.left || 
					outlineRect.left > insetRect.right || 
					outlineRect.bottom < insetRect.top || 
					outlineRect.top > insetRect.bottom))
					overlap = insetRect;
			});

			// If it overlaps, reduce opacity by the proportion of the vertical distance between two rectangles and the height of the marginal.
			if(overlap) {
				let distance = Math.abs((outlineRect.top + outlineRect.height / 2) - (overlap.top + overlap.height / 2));
				let proportion = distance / (overlap.height / 2);
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

	handleDoubleClick(event) {

		if(event.shiftKey) {
			this.setState({ editing: true, draft: this.props.app.getBook().getChapter(this.props.id).getText() })
		}

	}

	handleChange(event) {

		// TODO 
		var chapter = this.props.app.getBook().getChapter(this.props.id).getText();
		chapter.text = event.target.value;

		// What position should we scroll to?
		let position = event.target.selectionStart;

		// Update, then try to find the position.
		this.forceUpdate(() => {

			this.removeHighlights();

			// Which text node is closest?
			var textNodes = document.getElementsByClassName("text");
			for(var i = 0; i < textNodes.length; i++) {
				if(textNodes[i].dataset.position > position)
					break;
			}

			let match = textNodes[i - 1];

			// Highlight the match
			match.classList.add("content-highlight");

			// Scroll to the node.
			match.scrollIntoView({
				behavior: "smooth",
				block: "center"
			});
			
		});

	}

	removeHighlights() {

		// Which text node is closest?
		document.getElementsByClassName("content-highlight").forEach(highlight => highlight.classList.remove("content-highlight"));
		
	}

	renderEditor() {
		
		return <div className="editor">
			<em>You've found editing mode (shift+double click). This is useful for editing the underlying markup of the chapter and previewing your changes, which you can then copy and save elsehwere. This does not save the text of the chapter on this server, nor does it save between page reloads.</em>
			<br/>
			<br/>
			<textarea 
				className="editor-text" 
				onChange={this.handleChange} 
				value={this.props.app.getBook().getChapter(this.props.id).getText()}
			>
			</textarea>
			<button onClick={() => { this.removeHighlights(); this.setState({editing: false})}}>Done</button>
		</div>

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
					// If we don't have a bottom yet, or the current above is above this element's parent,
					// then set the current bottom to the bottom of this element.
					if(currentBottom === null || currentBottom < parentTop) {
						el.style.top = parentTop + "px";
						currentBottom = parentTop + elementBounds.height;
					}
					// If this element's parent position is above the current bottom, 
					// move it down, then set a new bottom based on the element's height.
					else {
						el.style.top = currentBottom + "px";
						currentBottom = currentBottom + elementBounds.height;
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
		var citationHighlight = null;
		var noteHighlight = null;
		var highlight = window.location.hash.split("#")[2];
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
			return null;
		}
		else {

			let chapter = book.getChapter(this.props.id);
			let chapterNumber = book.getChapterNumber(this.props.id);
			let chapterSection = book.getChapterSection(this.props.id);
			let citations = chapter.getAST().getCitations();
			let hasReferences = Object.keys(citations).length > 0;
			let headers = chapter.getAST().getHeaders();
			return (
				<div className="chapter">
					<Header 
						image={chapter.image} 
						header={
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
								<span id="title" className="chapter-title">{chapter.title}</span>
							</span>
						}
						tags={book.getTags()}
						/* If there are chapter authors, map them to authors declared in the book title, otherwise use all the authors of the book */
						content={
							<Authors authors={
									chapter.authors ? 
										chapter.authors.map(author => book.getAuthorByID(author)) : 
										book.getAuthors()} 
							/>
						} 
					/>

					<Outline
						previous={book.getPreviousChapterID(this.props.id)}
						next={book.getNextChapterID(this.props.id)}
						listener={ (expanded, callback) =>
							// If the outline is being expanded, hide the marginal, otherwise leave it alone.
							this.setState({ 
								marginal: expanded ? null : this.state.marginal 
							}, callback)
						}
						// Collapse the outline if a marginal is selected.
						collapse={this.state.marginal !== null}
					/>

					{ /* Render the editor if we're editing */ }
					{ this.state.editing ? this.renderEditor() : null }

					{/* Render the chapter body */}
					<div onDoubleClick={this.handleDoubleClick}>
					{
						chapter.getAST().toDOM(this, this.props.match.params.word)
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
			);
		}

	}

}

export { Chapter };