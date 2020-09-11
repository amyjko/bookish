import _ from 'lodash';
import React from 'react';
import { Link } from 'react-router-dom';

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