import React, { useContext, useEffect, useState } from 'react';
import Header from "./Header";
import Outline from './Outline';
import Edition from '../../models/book/Edition';
import Page from './Page'
import { renderNode } from '../chapter/Renderer';
import Instructions from './Instructions';
import { EditorContext } from './Edition';
import { Image } from '../../models/book/BookMedia';
import { FormatNode } from '../../models/chapter/FormatNode';

const MediaPreview = (props: { 
	url: string,
	alt: string,
	credit: React.ReactNode
}) => {

	const { url, alt, credit } = props;

	return <span className={"bookish-figure-preview"}>
		<img 
			src={url} 
			alt={alt}
		/>
		<div className="bookish-figure-credit">{credit}</div>
	</span>

}

export default function Media(props: { edition: Edition }) {

	const { editable } = useContext(EditorContext);
	const [ images, setImages ] = useState<undefined | Image[]>([]);

	const edition = props.edition;
	const embeds = edition.getEmbeds();
	const media = edition.getBook()?.getMedia();

	function updateImages(images: Image[]) {
		setImages(images);
	}

    // Always start at the top of the page.
	useEffect(() => {
		window.scrollTo(0, 0);
		media?.notify(updateImages);
		return () => media?.stopNotifying(updateImages);
	}, [])

	const unused = images?.filter(image => embeds.find(embed => embed.getURL() === image.url) === undefined);

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
				embeds.length === 0 ?
					<p>No images or videos appear in the book.</p> :
					<p>These are the images and videos in the book:</p>
			}
			{
				embeds.map((embed, index) =>
					<MediaPreview 
						key={"image" + index}
						url={embed.getSmallURL()} 
						alt={embed.getDescription()} 
						credit={ <span>{editable ? (images && images.find(i => i.url === embed.getURL()) === undefined) ? "linked" : "uploaded" : null }{embed.getCredit().isEmptyText() ? null : " • "}{renderNode(embed.getCredit())}</span>}
					/>
				)
			}
			{
				editable === undefined || unused === undefined || unused.length === 0 ? null :
				<>
					<h2>Unused</h2>
					<Instructions>
						These images are uploaded to this book, but not used.
						Delete them if you don't need them.
						Note, however, that these images may be used in other editions of this book.
					</Instructions>
					{
						unused.map((image, index) =>
							<MediaPreview
								key={"image" + index}
								url={image.url}
								alt={""}
								credit={<span>uploaded <button onClick={() => media?.remove(image).then(images => setImages(images))}>x</button></span>}
							/>
						)
					}
				</>
			}
	</Page>

}