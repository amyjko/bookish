import _ from 'lodash';
import React from 'react';
import { Link } from 'react-router-dom';

import { parseChapter } from "../parser";
import { Header } from './header';

class Chapter extends React.Component {


	render() {

		var chapter = this.props.app.getContent(this.props.id);
		var nextChapter = this.props.app.getNextChapter(this.props.id);

		if(chapter)
			return (
				<div>
					<Header image={chapter.image} header={chapter.title} content={null} />
					{parseChapter(chapter.text)}
					<div className="text-center lead">
					{
						nextChapter === null ? 
							<Link to={"/"}>Back to table of contents</Link> :
							<Link to={"/" + nextChapter.id}>Next chapter: {nextChapter.title}</Link>
					}
					</div>
				</div>
			);
		else
			return "Loading...";

	}

}

export { Chapter };