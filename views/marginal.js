import React from 'react';

class Marginal extends React.Component {

	constructor(props) {

		super(props);

		this.toggle = this.toggle.bind(this);

	}

	toggle() {

		if(this.props.app.getMarginal() === null || this.props.app.getMarginal() !== this.props.id) {
			this.props.app.setMarginal(this.props.id);
		} else {
			this.props.app.setMarginal(null);
		}

	}

	render() {

		let hidden = this.props.app.getMarginal() === null || this.props.app.getMarginal() !== this.props.id;

		return (
			<span>
				<span className={"marginal-interactor"} onClick={this.toggle}>
					{this.props.interactor}
				</span>
	            <span className={"marginal" + (hidden ? " marginal-hidden" : "")} onClick={this.toggle}>
					{this.props.content}
				</span>
			</span>
		)
	}

}

export {Marginal};