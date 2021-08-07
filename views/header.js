import React from 'react';

import { Parser } from "../parser";

class Header extends React.Component {

	render() {

		let tags = this.props.tags;

		return (
			<div>
				{
					this.props.image ?
						Parser.parseEmbed(null, this.props.image).toDOM() :
						null
				}
				<h1 className="title">{this.props.header}</h1>
				{ this.props.subtitle ? <h2 className="subtitle">{this.props.subtitle}</h2> : null }
				<div className="lead">{this.props.content}</div>
				{ tags ? 
					<div className="tag-list">{this.props.tags.map((tag, index) => <span key={"tag-" + index} className="tag">{tag}</span>)}</div> : 
					null }
			</div>
		);

	}

}

export {Header};