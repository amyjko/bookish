import React from 'react';
import { Header } from "./header";
import { Outline } from './outline';

class Glossary extends React.Component {

    // Always start at the top of the page.
	componentDidMount() {
		window.scrollTo(0, 0)
	}

	render() {

		let book = this.props.app.getBook();
        let glossary = book.getGlossary();
		// Sort by canonical phrases
		let keys = Object.keys(glossary).sort((a, b) => a.phrase.localeCompare(b.phrase));

		return (
			<div>
				<Header 
					image={book.getImage("glossary")} 
					header="Glossary"
					subtitle={null}
					tags={book.getTags()}
					content={null}
				/>

				<Outline
					previous={null}
					next={null}
				/>

				<br/>
				<div className="table-responsive">
					<table className="table">
						<tbody>
						{ keys.map((key, index) => 
							<tr key={"definition" + index}>
								<td><strong>{glossary[key].phrase}</strong></td>
								<td>
									{ glossary[key].definition }
									{ glossary[key].synonyms.length > 0 ? <span><br/><br/><em>{glossary[key].synonyms.join(", ")}</em></span> : null }
								</td>
							</tr>
						)}
						</tbody>
					</table>
				</div>
			</div>
		);

	}

}

export { Glossary };