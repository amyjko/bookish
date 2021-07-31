import React from 'react';

class Marginal extends React.Component {

	constructor(props) {

		super(props);

		this.state = {
			hidden: true
		};

		this.toggle = this.toggle.bind(this);

	}

	toggle() {

		this.setState({hidden: !this.state.hidden});

	}

	render() {
		return (
			<span className={this.props.className}>
				<span className={"marginal-right-interactor"} onClick={this.toggle}>
					{this.props.interactor}
				</span>
	            <span className={"marginal-right" + (this.state.hidden ? " marginal-right-hidden" : "")}>
					{this.props.content}
				</span>
			</span>
		)
	}

}

export {Marginal};