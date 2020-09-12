import _ from 'lodash';
import React from 'react';
import { Link } from 'react-router-dom';

import { ChapterParser, parseLine } from "../parser";
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
		if(chapter)
			this.scrollToLastLocation();
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
			this.setState({ loaded: true});
			this.scrollToLastLocation();
		}

	}

	scrollToLastLocation() {

		var progress = localStorage.getItem("chapterProgress");
		if(progress === null) {
			progress = {};
		} else {
			progress = JSON.parse(progress);
		}
		var progress = (this.props.id in progress) ? progress[this.props.id] : 0;
		var position = (progress / 100.0) * Math.max(document.body.scrollHeight, document.body.offsetHeight);

		window.scrollTo(0, position);

	}
	
	handleScroll() {

		var top = window.scrollY;
		var height = Math.max(document.body.scrollHeight, document.body.offsetHeight);
		var percent = Math.max(0, Math.round(100 * (top / height)));
		
		var progress = localStorage.getItem("chapterProgress");
		if(progress === null) {
			progress = {};
		} else {
			progress = JSON.parse(progress);
		}
		progress[this.props.id] = percent;
		localStorage.setItem("chapterProgress", JSON.stringify(progress));

	}

	render() {

		var chapter = this.props.app.getContent(this.props.id);
		var refHighlight = window.location.hash.split("#")[2];
		var refHighlight = refHighlight ? refHighlight.split("-")[1] : null;

		if(chapter) {
			var nextChapter = this.props.app.getNextChapter(this.props.id);
			var previousChapter = this.props.app.getPreviousChapter(this.props.id);
			var parse = new ChapterParser(chapter.text, this.props.app);
			var citations = parse.getCitations();
			return (
				<div>
					<Header image={chapter.image} header={chapter.title} content={null} />
					<div>
						<em>by</em> {parseLine(this.props.app.getAuthors())}
					</div>
					{parse.getElements()}
					{
						Object.keys(citations).length === 0 ? null :
						<div>
							<h1>References</h1>

							<ol>
							{_.map(Object.keys(citations).sort(), citationID => {
								var refs = this.props.app.getReferences();
								if(_.has(refs, citationID))
									return <li key={"citation-" + citationID} className={citationID === refHighlight ? "highlight" : null} id={"ref-" + citationID}>{parseLine(refs[citationID])}</li>
								else {
									return <li className="alert alert-danger">unknown reference "{citationID}"</li>;
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
						<Link to={"/"}>Table of Contents</Link>
						<span> | </span>
					{
						nextChapter ? <Link to={"/" + nextChapter.id}>Next</Link> : <span className="text-muted">Next</span>
					}						
					</div>
				</div>
			);
		}
		else
			return "...";

	}

}

export { Chapter };