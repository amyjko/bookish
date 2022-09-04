import React, { useEffect } from 'react';

import Header from "./Header";
import Outline from './Outline';

import Edition from '../../models/book/Edition';
import Page from './Page'
import { renderNode } from '../chapter/Renderer';
import Instructions from './Instructions';

export default function Media(props: { book: Edition }) {

    // Always start at the top of the page.
	useEffect(() => {
		window.scrollTo(0, 0)
	}, [])

	const book = props.book;
	const media = book.getMedia();

	return <Page>
			<Header 
				book={book}
				label="Media title"
				getImage={() => book.getImage(Edition.MediaID)}
				setImage={(embed) => book.setImage(Edition.MediaID, embed)}
				header="Media"
				tags={book.getTags()}
				outline={
					<Outline
						previous={book.getPreviousChapterID(Edition.MediaID)}
						next={book.getNextChapterID(Edition.MediaID)}
					/>
				}
			/>
			<Instructions>
				This index of media is created automatically.
			</Instructions>

			{
				media.length === 0 ?
					<p>There are no images in the book.</p> :
					<p>These are the images in the book:</p>
			}

			{
				media.map((embed, index) =>
					embed.getURL().indexOf("http") === 0 ?
						null :
						<span className={"bookish-figure-preview"} key={"image" + index}>
							<img 
								src={"images/" + embed.getURL()} 
								alt={embed.getDescription()}
							/>
							<div className="bookish-figure-credit">{renderNode(embed.getCredit())}</div>
						</span>
				)
			}
	</Page>

}