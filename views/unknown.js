import _ from 'lodash';
import React from 'react';
import { Link } from 'react-router-dom';

import { Header } from "./header";

class Unknown extends React.Component {

	render() {

		return <Header 
			image={this.props.app.getUnknown()} 
			header="Uh oh." 
			content={<p>This URL doesn't exist for this book. Want to go back to the <Link to="/">Table of Contents?</Link></p>}
		/>

	}

}

export {Unknown};