import React, { useContext } from 'react';
import { EmbedNode } from "../../models/chapter/EmbedNode";
import { EditorContext } from '../page/Book';
import { renderNode, renderPosition } from './Renderer';

const Embed = (props: { node: EmbedNode }) => {

	const { node } = props
	const url = node.getURL();
	const position = node.getPosition();
	const description = node.getDescription();
	const credit = node.getCredit();
	const caption = node.getCaption();

	const { editable } = useContext(EditorContext);

	return <div className={"bookish-figure " + renderPosition(position)} data-nodeid={props.node.nodeID}>
			{
				url.trim().length === 0 ? <div className="bookish-figure-unspecified">{ editable ? "Specify an image or video URL above." : "No image or video specified."}</div> :
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
						alt={description}
					/>
			}
			<div className="bookish-figure-caption"><div className="bookish-figure-credit">{renderNode(credit)}</div>{renderNode(caption)}</div>
		</div>

}

export default Embed;