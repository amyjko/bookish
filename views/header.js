import _ from 'lodash';
import React from 'react';

import {Figure} from "./image";

class Header extends React.Component {

	render() {

		return (
			<div>
				<Figure {...this.props.image}/>
				<h1>{this.props.header}</h1>
				<div className="lead">{this.props.content}</div>
			</div>
		);

	}

}

export {Header};