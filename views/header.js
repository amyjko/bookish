import _ from 'lodash';
import React from 'react';

import {CaptionedImage} from "./image";

class Header extends React.Component {

	render() {

		return (
			<div>
				<CaptionedImage {...this.props.image}/>
				<h1>{this.props.header}</h1>
				<div className="lead">{this.props.content}</div>
			</div>
		);

	}

}

export {Header};