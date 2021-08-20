import React from 'react';

import { Header } from "./header";
import { Outline } from './outline';
import { Page } from './page';

class Unknown extends React.Component {

	render() {
		return (
			<Page>
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
			</Page>
		);
	}

}

export { Unknown };