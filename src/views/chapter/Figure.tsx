import React from 'react';
import { EmbedNode } from "../../models/EmbedNode";
import { renderNode, renderPosition } from './Renderer';

const Figure = (props: { node: EmbedNode }) => {

	const { node } = props
	const url = node.getURL();
	const position = node.getPosition();
	const description = node.getDescription();
	const credit = node.getCredit();
	const caption = node.getCaption();

	return (
		<div className={"bookish-figure " + renderPosition(position)} data-nodeid={props.node.nodeID}>
			{
				url.includes("https://www.youtube.com") || 
				url.includes("https://youtu.be") || 
				url.includes("vimeo.com") ?
					<div className="bookish-figure-embed">
						<iframe 
							className="bookish-figure-frame" 
							src={url} 
							frameBorder="0" 
							allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" 
							allowFullScreen>
						</iframe>
					</div> :
					<img 
						className={"bookish-figure-image"}
						src={url.startsWith("http") ? url : "images/" + url} 
						alt={description}
					/>
			}
			<div className="bookish-figure-caption"><div className="bookish-figure-credit">{renderNode(credit)}</div>{renderNode(caption)}</div>
		</div>
	)

}

export default Figure;