import  _map from 'lodash/map';
import  _each from 'lodash/each';
import React from 'react';
import { Link } from 'react-router-dom';
import { NavHashLink } from "react-router-hash-link";

import { Parser } from "../parser";
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

		this.ast = null;

		// Assume the chapter is loaded initially.
		this.state = { 
			loaded: true, 
			editing: false, 
			draft: null,
			headerIndex: -1
		};

	}

	componentDidMount() {

		window.addEventListener('scroll', this.handleScroll);
		window.addEventListener('resize', this.handleResize);

		// If the component renders after the chapter is loaded and rendered, scroll to the last location.
		var chapter = this.props.app.getContent(this.props.id);
		if(chapter) {
			this.scrollToLastLocation();
		}
		// Otherwise, mark it as not loaded.
		else
			this.setState({ loaded: false })

	}

	componentWillUnmount() {
		window.removeEventListener('scroll', this.handleScroll);
	}

	// If the chapter was rendered, and the chapter wasn't yet loaded, but now it is, scroll to the last location.
	componentDidUpdate() {

		var chapter = this.props.app.getContent(this.props.id);
		if(!this.state.loaded && chapter) {

			// Remember that it was loaded.
			this.setState({ loaded: true});

			this.scrollToLastLocation();
		}

		// Position the marginals.
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

		var top = window.scrollY;
		// The ground truth location is the bottom of the window. (If we used the top of the window,
		// it wouldn't be possible to get to 100%, which would be very annoying when giving feedback to
		// readers about their progress!
		var height = Math.max(document.body.scrollHeight, document.body.offsetHeight) - window.innerHeight;
		var percent = Math.max(0, Math.round(100 * (top / height)));
		
		var progress = localStorage.getItem("chapterProgress");
		if(progress === null) {
			progress = {};
		} else {
			progress = JSON.parse(progress);
		}
		progress[this.props.id] = percent;
		localStorage.setItem("chapterProgress", JSON.stringify(progress));

		// Find the header that we're past so we can update the outline.
		let headers = document.getElementsByClassName("header");
		let indexOfNearestHeaderAbove = -1; // -1 represents the title
		for(let i = 0; i < headers.length; i++) {
			let header = headers[i];
			if(header.tagName === "H2" || header.tagName === "H3") {
				let rect = header.getBoundingClientRect();
				let headerTop = rect.y + top - rect.height;
				if(top > headerTop)
					indexOfNearestHeaderAbove = i;
			}
		}

		// Update the outline and progress bar.
		this.setState({ headerIndex: indexOfNearestHeaderAbove });

	}

	handleDoubleClick(event) {

		if(event.shiftKey) {

			var chapter = this.props.app.getContent(this.props.id);

			this.setState({ editing: true, draft: chapter.text })
		}

	}

	handleChange(event) {

		var chapter = this.props.app.getContent(this.props.id);
		chapter.text = event.target.value;

		// Invalidate the parse cache.
		this.ast = null;

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
		var highlights = document.getElementsByClassName("content-highlight");
		_each(highlights, highlight => highlight.classList.remove("content-highlight"));
		
	}

	renderEditor() {
		
		return <div className="editor">
			<em>You've found editing mode (shift+double click). This is useful for editing the underlying markup of the chapter and previewing your changes, which you can then copy and save elsehwere. This does not save the text of the chapter on this server, nor does it save between page reloads.</em>
			<br/>
			<br/>
			<textarea 
				className="editor-text" 
				onChange={this.handleChange} 
				value={this.props.app.getContent(this.props.id).text}
			>
			</textarea>
			<button onClick={() => { this.removeHighlights(); this.setState({editing: false})}}>Done</button>
		</div>

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

		var chapter = this.props.app.getContent(this.props.id);

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

		if(chapter === undefined) {
			return null;
		}
		else if(chapter === null) {
			return <p className="alert alert-danger">Unable to load chapter.</p>;
		}
		else {

			// Parse the chapter if necessary.
			if(this.ast === null)
				this.ast = Parser.parseChapter(chapter.text, this.props.app.getSymbols());

			let chapterNumber = this.props.app.getChapterNumber(this.props.id);
			let chapterSection = this.props.app.getChapterSection(this.props.id);
			let chapterAST = this.ast;
			let citations = chapterAST.getCitations();
			let headers = chapterAST.getHeaders();
			return (
				<div className="chapter">
					<Header 
						image={chapter.image} 
						header={
							<span>
								{
									chapterNumber === null ? 
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
						tags={this.props.app.getTags()}
						/* If there are chapter authors, map them to authors declared in the book title, otherwise use all the authors of the book */
						content={
							<Authors authors={
									chapter.authors ? 
										_map(chapter.authors, author => this.props.app.getAuthorByID(author)) : 
										this.props.app.getAuthors()} 
							/>
						} 
					/>

					<Outline
						title={chapter.title}
						headers={headers}
						headerIndex={this.state.headerIndex}
						previous={this.props.app.getPreviousChapter(this.props.id)}
						next={this.props.app.getNextChapter(this.props.id)}
					/>

					{ /* Render the editor if we're editing */ }
					{ this.state.editing ? this.renderEditor() : null }

					<div onDoubleClick={this.handleDoubleClick}>
					{
						chapterAST.toDOM(this.props.app, this.props.match.params.word)
					}
					</div>
					{
						Object.keys(citations).length === 0 ? null :
						<div>
							<h1>References</h1>

							<ol>
							{
								_map(Object.keys(citations).sort(), citationID => {
									var refs = this.props.app.getReferences();
									if(citationID in refs) {
										var ref = refs[citationID];
										return <li key={"citation-" + citationID} className={citationID === citationHighlight ? "reference content-highlight" : "reference"} id={"ref-" + citationID}>
											{Parser.parseReference(ref, this.props.app)}
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