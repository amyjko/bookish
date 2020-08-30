import _ from 'lodash';
import React from 'react';

class Chapter extends React.Component {

	render() {

		var chapter = this.props.app.getContent(this.props.id);

		return (
			<div>
				<h1>{chapter.title}</h1>
				<p>{chapter.text}</p>
			</div>
		);

	}

}

export { Chapter };