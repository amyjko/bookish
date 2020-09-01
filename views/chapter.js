import _ from 'lodash';
import React from 'react';
import { Link } from 'react-router-dom';
import $ from 'jquery';

import { ChapterParser, parseLine } from "../parser";
import { Header } from './header';

class Chapter extends React.Component {

	// Always start at the top of the page.
	componentDidMount() {
		window.scrollTo(0, 0)
	}

	render() {

		var chapter = this.props.app.getContent(this.props.id);
		var refHighlight = window.location.hash.split("#")[2];
		var refHighlight = refHighlight ? refHighlight.split("-")[1] : null;

		if(chapter) {
			var nextChapter = this.props.app.getNextChapter(this.props.id);
			var previousChapter = this.props.app.getPreviousChapter(this.props.id);
			var parse = new ChapterParser(chapter.text);
			var citations = parse.getCitations();
			return (
				<div>
					<Header image={chapter.image} header={chapter.title} content={null} />
					{parse.getElements()}
					<div className="text-center lead">
					{
						previousChapter ? <span><Link to={"/" + previousChapter.id}>Previous: {previousChapter.title}</Link> | </span> : null						
					}
						<Link to={"/"}>Table of Contents</Link>
					{
						nextChapter ? <span> | <Link to={"/" + nextChapter.id}>Next: {nextChapter.title}</Link></span> : null						
					}
					</div>
					{
						citations.length === 0 ? null :
						<div>
							<h1>References</h1>

							<ol>
							{_.map(citations, citationID => {
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
				</div>
			);
		}
		else
			return "Loading...";

	}

}

export { Chapter };