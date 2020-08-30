import _ from 'lodash';
import React from 'react';

class Figure extends React.Component {

	render() {
		return (
			<div className="figure">
				{
					this.props.url.includes("https://www.youtube.com") || this.props.url.includes("https://youtu.be") ?
						<div className="embed-responsive embed-responsive-16by9">
							<iframe className="embed-responsive-item" src={this.props.url} frameBorder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
						</div> :
						<img className="img-fluid figure-img" src={"images/" + this.props.url} alt={this.props.alt} />
				}
				<div className="figure-caption">{this.props.caption} <em>Credit: {this.props.credit}</em></div>
			</div>
		)
	}

}

export {Figure};