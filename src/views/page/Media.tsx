import React, { useContext, useEffect } from 'react';

import Header from "./Header";
import Outline from './Outline';

import Edition from '../../models/book/Edition';
import Page from './Page'
import { renderNode } from '../chapter/Renderer';
import Instructions from './Instructions';
import { EditorContext } from './Edition';

export default function Media(props: { edition: Edition }) {

	const { editable } = useContext(EditorContext);

    // Always start at the top of the page.
	useEffect(() => {
		window.scrollTo(0, 0)
	}, [])

	const edition = props.edition;
	const media = edition.getMedia();
	const images = edition.getBook()?.getMedia().getImages();

	const unlinkedImages = images?.filter(image => media.find(embed => embed.getURL() === image.url) === undefined);

	return <Page>
			<Header 
				book={edition}
				label="Media title"
				getImage={() => edition.getImage(Edition.MediaID)}
				setImage={(embed) => edition.setImage(Edition.MediaID, embed)}
				header="Media"
				tags={edition.getTags()}
				outline={
					<Outline
						previous={edition.getPreviousChapterID(Edition.MediaID)}
						next={edition.getNextChapterID(Edition.MediaID)}
					/>
				}
			/>
			<Instructions>
				This page shows readers an index of the media in the book.
				Writers can use this page to manage any images that are linked or uploaded for this book.
				Note: images are shared between all editions, so if you delete one not used in this edition,
				it might be used in others.
			</Instructions>

			{
				media.length === 0 ?
					<p>There are no images in the book.</p> :
					<p>These are the images in the book:</p>
			}
			{
				media.map((embed, index) =>
					<span className={"bookish-figure-preview"} key={"image" + index}>
						<img 
							src={embed.getURL().indexOf("http") === 0 ? embed.getURL() : "images/" + embed.getURL()} 
							alt={embed.getDescription()}
						/>
						<div className="bookish-figure-credit">{renderNode(embed.getCredit())}</div>
					</span>
				)
			}
			{
				editable === undefined || unlinkedImages === undefined || unlinkedImages.length === 0 ? null :
				<>
					<h2>Unused Images in this Edition</h2>
					{
						unlinkedImages.map((image, index) =>
							<span className={"bookish-figure-preview"} key={"image" + index}>
								<img 
									src={image.url} 
									alt={image.description}
								/>
							</span>
						)
					}
				</>
			}
	</Page>

}