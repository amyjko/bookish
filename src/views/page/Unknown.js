import React from 'react';

import Header from "./Header";
import Outline from './Outline';
import Page from './Page';

class Unknown extends React.Component {

	render() {
		return (
			<Page>
				<Header 
					book={this.props.book}
					image={this.props.book.getImage("unknown") } 
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

export default Unknown;