import React from 'react';

import Header from "./Header";
import Outline from './Outline';

import Book from '../../models/Book';
import { renderNode } from '../chapter/Renderer';

class Media extends React.Component {

    // Always start at the top of the page.
	componentDidMount() {
		window.scrollTo(0, 0)
	}

	render() {

		const book = this.props.book;
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

				<p>These are the images in the book:</p>

				{
					media.map((embed, index) =>
						embed.url.indexOf("http") === 0 ?
							null :
							<span className={"bookish-figure-preview"} key={"image" + index}>
								<img 
									src={"images/" + embed.url} 
									alt={embed.alt}
								/>
								<div className="bookish-figure-credit">{renderNode(embed.credit)}</div>
							</span>
					)
				}

			</div>
		);

	}

}

export default Media