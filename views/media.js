import React from 'react';

import { Header } from "./header";
import { Outline } from './outline';

class Media extends React.Component {

    // Always start at the top of the page.
	componentDidMount() {
		window.scrollTo(0, 0)
	}

	render() {

		const book = this.props.app.getBook();
		const media = book.getMedia();

		return (
			<div>
				<Header 
					image={book.getImage("media")} 
					header="Media"
					subtitle={null}
					tags={book.getTags()}
					content={null}
				/>

				<Outline
					previous={null}
					next={null}
				/>

				<p>These images appear in the text.</p>

				{
					media.map((embed, index) =>
						embed.url.indexOf("http") === 0 ?
							null :
							<img 
								key={"image" + index}
								className={"img-preview"}
								src={"images/" + embed.url} 
								alt={embed.alt}
							/>
					)
				}

			</div>
		);

	}

}

export { Media };