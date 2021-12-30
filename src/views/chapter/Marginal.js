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

		if(this.props.chapter.getMarginal() === null || this.props.chapter.getMarginal() !== this.props.id) {
			this.props.chapter.setMarginal(this.props.id);
		} else {
			this.props.chapter.setMarginal(null);
		}

	}

	handleEnter() { this.setState({ hovered: true }); }
	handleExit() { this.setState({ hovered: false }); }

	render() {

		let hidden = this.props.chapter.getMarginal() === null || this.props.chapter.getMarginal() !== this.props.id;

		return (
			<span>
				<span className={"bookish-marginal-interactor" + (this.state.hovered ? " bookish-marginal-hovered" : "")} onClick={this.toggle} onMouseEnter={this.handleEnter} onMouseLeave={this.handleExit}>
					{this.props.interactor}
				</span>
	            <span className={"bookish-marginal" + (hidden ? " bookish-marginal-hidden" : "") + (this.state.hovered ? " bookish-marginal-hovered" : "")} onClick={this.toggle} onMouseEnter={this.handleEnter} onMouseLeave={this.handleExit}>
					{this.props.content}
				</span>
			</span>
		)
	}

}

export default Marginal;