import _ from 'lodash';
import React from 'react';

import { parseLine } from "../parser.js";

class References extends React.Component {

    // Always start at the top of the page.
	componentDidMount() {
		window.scrollTo(0, 0)
	}

	render() {

        var references = this.props.app.getReferences();
        if(references && references.length === 0)
            references = null;

		return (
			<div>
				<h1>References</h1>
				{
                    references === null ?
                        <p>This book has no references.</p> :
                        _.map(_.keys(references).sort(), (citationID) => {
                            return <p key={citationID}>{parseLine(references[citationID])}</p>
                        })
                }
			</div>
		);

	}

}

export {References};