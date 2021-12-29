import React from 'react';

class Authors extends React.Component {

	render() {
		return (
            <div className="authors">
                <em>by</em> {
                    this.props.authors.map( 
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

export default Authors