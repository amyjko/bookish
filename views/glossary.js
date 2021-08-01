import _map from 'lodash/map';
import React from 'react';
import { Link } from 'react-router-dom';

import { Parser } from "../parser.js";

class Glossary extends React.Component {

    // Always start at the top of the page.
	componentDidMount() {
		window.scrollTo(0, 0)
	}

	render() {

        var glossary = this.props.app.getGlossary();
		// Sort by canonical phrases
		var keys = Object.keys(glossary).sort((a, b) => a.phrase.localeCompare(b.phrase));


		return (
			<div>
				<h1>Glossary</h1>

				<table className="table">
					<tbody>
					{ _map(keys, key => 
						<tr>
							<td><strong>{glossary[key].phrase}</strong></td>
							<td>
								{ glossary[key].definition }
								{ glossary[key].synonyms.length > 0 ? <span><br/><br/><em>{glossary[key].synonyms.join(", ")}</em></span> : null }
							</td>
						</tr>
					)}
					</tbody>
				</table>

				<div className="navigation-footer">
					<Link to={"/"}>Table of Contents</Link>
				</div>
			</div>
		);

	}

}

export { Glossary };