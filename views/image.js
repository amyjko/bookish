import React from 'react';

class Figure extends React.Component {

	render() {
		return (
			<div className={"figure figure-" + (this.props.position === "<" ? "left" : this.props.position === ">" ? "right" : "center")}>
				{
					this.props.url.includes("https://www.youtube.com") || 
					this.props.url.includes("https://youtu.be") || 
					this.props.url.includes("vimeo.com") ?
						<div className="embed-responsive embed-responsive-16by9">
							<iframe 
								className="embed-responsive-item" 
								src={this.props.url} 
								frameBorder="0" 
								allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" 
								allowFullScreen>
							</iframe>
						</div> :
						<img 
							className={"img-fluid figure-img"}
							src={this.props.url.startsWith("http") ? this.props.url : "images/" + this.props.url} 
							alt={this.props.alt}
						/>
				}
				<div className="figure-caption">{this.props.caption} <span className="figure-credit">Credit: {this.props.credit}</span></div>
			</div>
		)
	}

}

export {Figure};