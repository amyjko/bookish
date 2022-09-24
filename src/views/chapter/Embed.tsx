import React, { useContext, useState } from 'react';
import { EmbedNode } from "../../models/chapter/EmbedNode";
import { EditorContext } from '../page/Edition';
import { renderNode, renderPosition } from './Renderer';
import { storage } from '../../models/Firebase';
import { CaretContext, CaretContextType } from '../editor/BookishEditor';

const Embed = (props: { node: EmbedNode }) => {

	const { node } = props
	const url = node.getURL();
	const position = node.getPosition();
	const description = node.getDescription();
	const credit = node.getCredit();
	const caption = node.getCaption();

	const { editable, edition } = useContext(EditorContext);
    const caret = useContext<CaretContextType>(CaretContext);

	const [ dragging, setDragging ] = useState(false);
	const [ dragFeedback, setDragFeedback ] = useState<undefined|string>(undefined);

	function handleDrop(event: React.DragEvent<HTMLDivElement>) {
		event.preventDefault();
		if(event.dataTransfer?.items) {
			// Get the files and convert them to file opens, then filter by allowed file extensions
			const imageFiles = [...event.dataTransfer.items]
				.filter(item => item.kind === 'file')
				.map(item => item.getAsFile())
				.filter(file => file !== null && /.*\.(jpg|jpeg|png)/i.test(file.name));
			if(imageFiles.length === 0)
				setDragFeedback("Only JPEG or PNG images are allowed.");
			else if(imageFiles.length > 1)
				setDragFeedback("Only one image at a time please!");
			else {
				setDragFeedback("Uploading…");

				const file = imageFiles[0];
				const media = edition?.getBook()?.getMedia();

				if(file === null) return;
				if(storage === undefined) return;
				if(media === undefined) return;
		
				media.upload(file, 
					(progress: number) => setDragFeedback(`${progress}% done`),
					(error: string) => { setDragFeedback(error); setDragging(false); },
					(url: string, thumbnails: string) => {
						// Upload completed successfully, now we can get the download URL
						caret?.edit(node, node.withURLs(url, thumbnails).withDescription(""));
						setDragging(false);
						setDragFeedback(undefined);
					}
				);				
			}

		}
	}

	function handleDrag(event: React.DragEvent<HTMLDivElement>) { 
		event?.preventDefault(); 
		setDragging(true); 
		setDragFeedback("Drop to upload…");
	}

	function handleDragLeave(event: React.DragEvent<HTMLDivElement>) { 
		if(event.target !== event.currentTarget) return;
		event?.preventDefault(); 
		setDragging(false); 
		setDragFeedback(undefined);
	}

	return <div className={"bookish-figure " + renderPosition(position)} data-nodeid={props.node.nodeID}>
			{
				url.trim().length === 0 ? 
					editable ? 
						<div 
							className={`bookish-figure-unspecified ${dragging ? "bookish-figure-dragging" : ""}`}
							onDrop={handleDrop}
							onDragOver={handleDrag}
							onDragLeave={handleDragLeave}
						>{
							dragFeedback === undefined ? 
								"Click or drag to choose or upload an image, or enter an image or video URL." :
								dragFeedback
						}</div> : 
						<div className="bookish-figure-unspecified">No image or video specified</div>
					:
				url.includes("https://www.youtube.com") || 
				url.includes("https://youtu.be") || 
				url.includes("https://www.tiktok.com") || 
				url.includes("vimeo.com") ?
					<div className="bookish-figure-embed">
						<iframe 
							className="bookish-figure-frame" 
							src={url} 
							frameBorder="0" 
							allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" 
							allowFullScreen>
						</iframe>
					</div> 
				:
					<img 
						className={"bookish-figure-image"}
						src={url.startsWith("http") ? url : "images/" + url}
						// If the image is hosted, included a source set
						srcSet={node.hasSmallURL() ? `${node.getSmallURL()} 320w, ${url} 1024w` : undefined }
						sizes={node.hasSmallURL() ? "(min-width: 1024px) 1024px, 320px" : undefined }
						alt={description}
					/>
			}
			<div className="bookish-figure-caption"><div className="bookish-figure-credit">{renderNode(credit)}</div>{renderNode(caption)}</div>
		</div>

}

export default Embed;