import  _map from 'lodash/map';
import  _each from 'lodash/each';
import React from 'react';
import { Link } from 'react-router-dom';
import { NavHashLink } from "react-router-hash-link";

import { Parser } from "../parser";
import { Header } from './header';
import { Authors } from "./authors";

class Chapter extends React.Component {

	constructor(props){
		super(props);

		this.handleScroll = this.handleScroll.bind(this);
		this.handleDoubleClick = this.handleDoubleClick.bind(this);
		this.handleChange = this.handleChange.bind(this);

		this.ast = null;

		// Assume the chapter is loaded initially.
		this.state = { 
			loaded: true, 
			editing: false, 
			draft: null
		};

	}

	componentDidMount() {

		window.addEventListener('scroll', this.handleScroll);

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
			window.scrollTo(0, position);

		}

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

		// Update the progress bar in the navigation bar.
		this.forceUpdate();

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
			let nextChapter = this.props.app.getNextChapter(this.props.id);
			let previousChapter = this.props.app.getPreviousChapter(this.props.id);
			let chapterAST = this.ast;
			let citations = chapterAST.getCitations();
			let footnotes = chapterAST.getFootnotes();
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
								<span className="chapter-title">{chapter.title}</span>
							</span>
						}
						content={null} 
					/>
					{ /* If there are chapter authors, map them to authors declared in the book title, otherwise use all the authors of the book */ }
					<Authors authors={chapter.authors ? _map(chapter.authors, author => this.props.app.getAuthorByID(author)) : this.props.app.getAuthors()} />

					{ /* Render the chapter outline */ }
					<div className="outline">
					{
						_map(headers, (header, index) => 
							// Only first and second level headers...
							header.level > 2 ? 
								null :
								<NavHashLink key={"header-" + index} smooth to={"#header-" + index} className={"outline-header outline-header-level-" + header.level}>{header.toText()}</NavHashLink>)
					}
					</div>

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
					<div className="navigation-footer">
					{
						previousChapter ? <span><Link to={"/" + previousChapter.id}>Previous</Link></span> : <span className="text-muted">Previous</span>				
					}
						<span> | </span>
						<NavHashLink to={"/#toc"}>Table of Contents</NavHashLink>
						<span> | </span>
					{
						nextChapter ? <Link to={"/" + nextChapter.id}>Next</Link> : <span className="text-muted">Next</span>
					}
						<div className="progress" style={{right: "" + (100 - this.getProgress()) + "%"}}></div>
					</div>
				</div>
			);
		}

	}

}

export { Chapter };