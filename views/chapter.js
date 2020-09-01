import _ from 'lodash';
import React from 'react';
import { Link } from 'react-router-dom';

import { ChapterParser, parseLine } from "../parser";
import { Header } from './header';

class Chapter extends React.Component {


	render() {

		var chapter = this.props.app.getContent(this.props.id);

		if(chapter) {
			var nextChapter = this.props.app.getNextChapter(this.props.id);
			var parse = new ChapterParser(chapter.text);
			var citations = parse.getCitations();
			return (
				<div>
					<Header image={chapter.image} header={chapter.title} content={null} />
					{parse.getElements()}
					<div className="text-center lead">
					{
						nextChapter ? 
						<Link to={"/" + nextChapter.id}>Next chapter: {nextChapter.title}</Link> :
						<Link to={"/"}>Back to table of contents</Link>
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
									return <li key={"citation-" + citationID} id={"ref-" + citationID}>{parseLine(refs[citationID])}</li>
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