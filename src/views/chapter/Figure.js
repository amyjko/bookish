import React from 'react';
import { renderNode, renderPosition } from './Renderer';

function Figure(props) {

	const { node, context, key} = props

	return (
		<div key={key} className={"figure" + renderPosition(node.position)}>
			{
				node.url.includes("https://www.youtube.com") || 
				node.url.includes("https://youtu.be") || 
				node.url.includes("vimeo.com") ?
					<div className="embed-responsive embed-responsive-16by9">
						<iframe 
							className="embed-responsive-item" 
							src={node.url} 
							frameBorder="0" 
							allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" 
							allowFullScreen>
						</iframe>
					</div> :
					<img 
						className={"img-fluid figure-img"}
						src={node.url.startsWith("http") ? node.url : "images/" + node.url} 
						alt={node.description}
					/>
			}
			<div className="figure-caption"><div className="figure-credit">{renderNode(node.credit, context)}</div>{renderNode(node.caption, context)}</div>
		</div>
	)

}

export default Figure;