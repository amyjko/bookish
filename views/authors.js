import React from 'react';
import _map from 'lodash/map';

import { Parser } from "../parser";

class Authors extends React.Component {

	render() {
		return (
            <div className="authors">
                <em>by</em> {Parser.parseContent(this.props.authors).toDOM()}
                <small>
                    { 
                        this.props.contributors && this.props.contributors.length > 0 ? 
                            <span>
                                <em> with contributions from </em> 
                                {
                                    _map(
                                        this.props.contributors, 
                                        (contributor, index) => 
                                            <span key={index}>
                                                {
                                                    Parser.parseContent(contributor).toDOM(undefined, undefined, undefined, index)}
                                                    {index === this.props.contributors.length - 1 ? "" : ", "
                                                }
                                            </span>
                                    )
                                }
                            </span> : 
                            null
                        }
                </small>
            </div>
        );
	}

}

export {Authors};