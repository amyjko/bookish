import React from 'react';
import _map from 'lodash/map';

class Authors extends React.Component {

	render() {
		return (
            <div className="authors">
                <em>by</em> {
                    _map(
                        this.props.authors, 
                        (author, index) => [
                            author.url ? <a key={"author-" + index} href={author.url} target="_blank">{author.name}</a> : author.name,
                            index < this.props.authors.length - 1 ? (", ") : null
                        ]
                    )
                }
            </div>
        );
	}

}

export {Authors};