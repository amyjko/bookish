import React, { useEffect } from 'react';

import Header from "./Header";
import Outline from './Outline';

import Book from '../../models/Book';
import Page from './Page'
import { renderNode } from '../chapter/Renderer';

export default function Media(props: { book: Book }) {

    // Always start at the top of the page.
	useEffect(() => {
		window.scrollTo(0, 0)
	}, [])

	const book = props.book;
	const media = book.getMedia();

	return <Page>
			<Header 
				book={book}
				image={book.getImage(Book.MediaID)} 
				header="Media"
				tags={book.getTags()}
				outline={
					<Outline
						previous={book.getPreviousChapterID(Book.MediaID)}
						next={book.getNextChapterID(Book.MediaID)}
					/>
				}
			/>

			{
				media.length === 0 ?
					<p>There are no images in the book.</p> :
					<p>These are the images in the book:</p>
			}

			{
				media.map((embed, index) =>
					embed.url.indexOf("http") === 0 ?
						null :
						<span className={"bookish-figure-preview"} key={"image" + index}>
							<img 
								src={"images/" + embed.url} 
								alt={embed.description}
							/>
							<div className="bookish-figure-credit">{renderNode(embed.credit)}</div>
						</span>
				)
			}
	</Page>

}