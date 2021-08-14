import React from 'react';

import { Parser } from "../models/parser";

class Header extends React.Component {

	render() {

		let tags = this.props.tags;

		return (
			<div className="chapter-header">
				{
					this.props.image ?
						<div className="full-width">{ Parser.parseEmbed(null, this.props.image).toDOM() }</div> :
						null
				}
				<h1 id="title" className="title header">{this.props.header}</h1>
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