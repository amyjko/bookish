import React from 'react';
import { renderNode, renderPosition } from './Renderer';

function Figure(props) {

	const { node, context, key} = props

	return (
		<div key={key} className={"bookish-figure" + renderPosition(node.position)}>
			{
				node.url.includes("https://www.youtube.com") || 
				node.url.includes("https://youtu.be") || 
				node.url.includes("vimeo.com") ?
					<div className="bookish-figure-embed">
						<iframe 
							className="bookish-figure-frame" 
							src={node.url} 
							frameBorder="0" 
							allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" 
							allowFullScreen>
						</iframe>
					</div> :
					<img 
						className={"bookish-figure-image"}
						src={node.url.startsWith("http") ? node.url : "images/" + node.url} 
						alt={node.description}
					/>
			}
			<div className="bookish-figure-caption"><div className="bookish-figure-credit">{renderNode(node.credit, context)}</div>{renderNode(node.caption, context)}</div>
		</div>
	)

}

export default Figure;