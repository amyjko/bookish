import React from 'react';

import { Parser } from "../parser";

class Header extends React.Component {

	render() {
		return (
			<div>
				{
					this.props.image ?
						Parser.parseEmbed(this.props.image).toDOM() :
						null
				}
				<h1 className="title">{this.props.header}</h1>
				{ this.props.subtitle ? <h2 className="subtitle">{this.props.subtitle}</h2> : null }
				<div className="lead">{this.props.content}</div>
			</div>
		);

	}

}

export {Header};