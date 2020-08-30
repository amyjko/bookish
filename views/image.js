import _ from 'lodash';
import React from 'react';

class CaptionedImage extends React.Component {

	render() {
		return (
			<div className="figure">
				<img className="img-fluid figure-img" src={"images/" + this.props.url} alt={this.props.alt} />		
				<div className="figure-caption">{this.props.caption} <em>Credit: {this.props.credit}</em></div>
			</div>
		)
	}

}

export {CaptionedImage};