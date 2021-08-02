import React from 'react';

class Marginal extends React.Component {

	constructor(props) {

		super(props);

		this.toggle = this.toggle.bind(this);
		this.handleEnter = this.handleEnter.bind(this);
		this.handleExit = this.handleExit.bind(this);

		this.state = {
			hovered: false
		}

	}

	toggle() {

		if(this.props.app.getMarginal() === null || this.props.app.getMarginal() !== this.props.id) {
			this.props.app.setMarginal(this.props.id);
		} else {
			this.props.app.setMarginal(null);
		}

	}

	handleEnter() { this.setState({ hovered: true }); }
	handleExit() { this.setState({ hovered: false }); }

	render() {

		let hidden = this.props.app.getMarginal() === null || this.props.app.getMarginal() !== this.props.id;

		return (
			<span>
				<span className={"marginal-interactor" + (this.state.hovered ? " marginal-hovered" : "")} onClick={this.toggle} onMouseEnter={this.handleEnter} onMouseLeave={this.handleExit}>
					{this.props.interactor}
				</span>
	            <span className={"marginal" + (hidden ? " marginal-hidden" : "") + (this.state.hovered ? " marginal-hovered" : "")} onClick={this.toggle} onMouseEnter={this.handleEnter} onMouseLeave={this.handleExit}>
					{this.props.content}
				</span>
			</span>
		)
	}

}

export {Marginal};