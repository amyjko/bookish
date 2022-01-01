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

	// If there's no marginal selected or this is different from the current selection, this is hidden.
	isHidden() { 
		return this.props.context.marginalID === null || this.props.context.marginalID !== this.props.id
	}

	toggle() {

		if(this.isHidden()) {
			this.props.context.setMarginal(this.props.id);
		} 
		// Otherwise, deselect.
		else {
			this.props.context.setMarginal(null);
		}

	}

	handleEnter() { this.setState({ hovered: true }); }
	handleExit() { this.setState({ hovered: false }); }

	render() {

		return (
			<span>
				<span className={"bookish-marginal-interactor" + (this.state.hovered ? " bookish-marginal-hovered" : "")} onClick={this.toggle} onMouseEnter={this.handleEnter} onMouseLeave={this.handleExit}>
					{this.props.interactor}
				</span>
	            <span className={"bookish-marginal" + (this.isHidden() ? " bookish-marginal-hidden" : "") + (this.state.hovered ? " bookish-marginal-hovered" : "")} onClick={this.toggle} onMouseEnter={this.handleEnter} onMouseLeave={this.handleExit}>
					{this.props.content}
				</span>
			</span>
		)
	}

}

export default Marginal;