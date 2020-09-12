import _ from 'lodash';
import React from 'react';
import { Link } from 'react-router-dom';

import { Header } from "./header";

class Unknown extends React.Component {

	render() {

		return <Header 
			image={this.props.app.getUnknown()} 
			header="Uh oh."
			content={this.props.message}
		/>

	}

}

export {Unknown};