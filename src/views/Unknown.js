import React from 'react';

import { ChapterHeader } from "./ChapterHeader";
import { Outline } from './Outline';
import { Page } from './Page';

class Unknown extends React.Component {

	render() {
		return (
			<Page>
				<ChapterHeader 
					book={this.props.app.getBook()}
					image={this.props.app.getBook().getImage("unknown") } 
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