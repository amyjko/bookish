import React from 'react';
import { Link } from 'react-router-dom';
import { Header } from "./header";
import { Parser } from "../models/parser.js";

class References extends React.Component {

    // Always start at the top of the page.
	componentDidMount() {
		window.scrollTo(0, 0)
	}

	render() {

		let book = this.props.app.getBook();

        var references = book.getReferences();
        if(references && references.length === 0)
            references = null;

		return (
			<div>
				<Header 
					image={book.getImage("references")} 
					header="References"
					subtitle={null}
					tags={book.getTags()}
					content={null}
				/>
				{
                    references === null ?
                        <p>This book has no references.</p> :
                        Object.keys(references).sort().map(citationID => 
                            <p key={citationID}>{Parser.parseReference(references[citationID], book)}</p>
                        )
                }
				<div className="navigation-footer">
					<Link to={"/"}>Home</Link>
				</div>
			</div>
		);

	}

}

export { References };