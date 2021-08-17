import React from 'react';

import { Header } from "./header";
import { Outline } from './outline';

class Unknown extends React.Component {

	render() {
		return (
			<div>
				<Header 
					book={this.props.app.getBook()}
					image={this.props.app.getBook().getSpecification() ? this.props.app.getBook().getImage("unknown") : null } 
					header="Oops."
					after={this.props.message}
				/>
				<Outline
					previous={null}
					next={null}
				/>
			</div>
		);
	}

}

export { Unknown };