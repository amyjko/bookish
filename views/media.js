import React from 'react';

import { Header } from "./header";
import { Outline } from './outline';
import { Book } from '../models/book.js';

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
					book={book}
					image={book.getImage(Book.MediaID)} 
					header="Media"
					tags={book.getTags()}
				/>

				<Outline
					previous={book.getPreviousChapterID(Book.MediaID)}
					next={book.getNextChapterID(Book.MediaID)}
				/>

				<p>These images appear in the text.</p>

				{
					media.map((embed, index) =>
						embed.url.indexOf("http") === 0 ?
							null :
							<img 
								key={"image" + index}
								className={"figure-preview"}
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