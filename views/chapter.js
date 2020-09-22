import _map from 'lodash/map';
import React from 'react';
import { Link } from 'react-router-dom';
import { NavHashLink } from "react-router-hash-link";

import { Parser } from "../parser";
import { Header } from './header';


class Chapter extends React.Component {

	constructor(props){
		super(props);

		this.handleScroll = this.handleScroll.bind(this);

		// Assume the chapter is loaded initially.
		this.state = { loaded : true };

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

			var match = document.getElementsByClassName("query-match");

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

	render() {

		var chapter = this.props.app.getContent(this.props.id);
		var refHighlight = window.location.hash.split("#")[2];
		var refHighlight = refHighlight ? refHighlight.split("-")[1] : null;

		if(chapter === undefined) {
			return null;
		}
		else if(chapter === null) {
			return <p className="alert alert-danger">Unable to load chapter.</p>;
		}
		else {
			var nextChapter = this.props.app.getNextChapter(this.props.id);
			var previousChapter = this.props.app.getPreviousChapter(this.props.id);
			var chapterAST = Parser.parseChapter(chapter.text);
			var citations = chapterAST.getCitations();
			return (
				<div>
					<Header image={chapter.image} header={chapter.title} content={null} />
					<div>
						<em>by</em> {Parser.parseContent(this.props.app.getAuthors()).toDOM()}
					</div>
					{chapterAST.toDOM(this.props.app, this.props.match.params.word)}
					{
						Object.keys(citations).length === 0 ? null :
						<div>
							<h1>References</h1>

							<ol>
							{_map(Object.keys(citations).sort(), citationID => {
								var refs = this.props.app.getReferences();
								if(citationID in refs) {
									var ref = refs[citationID];
									return <li key={"citation-" + citationID} className={citationID === refHighlight ? "highlight" : null} id={"ref-" + citationID}>
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