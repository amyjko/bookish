import React from 'react';

import Parser from "../../models/Parser";
import { renderNode } from '../chapter/Renderer'

class Header extends React.Component {

	render() {

		let tags = this.props.tags;

		return (
			<div className="bookish-chapter-header">
				{
					this.props.image ?
						<div className="bookish-figure-full">
							{ renderNode(Parser.parseEmbed(this.props.book, this.props.image)) }
							{ this.props.print ? null : <div id="bookish-scroll-reminder"></div> }
						</div> :
						// Add a bit of space to account for the lack of an image.
						<p>&nbsp;</p>
				}
				<div className="bookish-chapter-header-text">
					{ this.props.before }
					<h1 id="title" className="bookish-title">{this.props.header}</h1>
					{ this.props.subtitle ? <h2 className="bookish-subtitle">{this.props.subtitle}</h2> : null }
					{ this.props.after }
					{ tags ? 
						<div>{this.props.tags.map((tag, index) => <span key={"tag-" + index} className="bookish-tag">{tag}</span>)}</div> : 
						null }
				</div>
			</div>
		);

	}

}

export default Header