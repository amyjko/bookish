import React, { useEffect, useState, useContext, ReactElement } from 'react';
import { ChapterContext } from './ChapterContext';

import { isMobile, watchMobile } from '../util/isMobile';

 const Marginal = (props: { id: string, content: ReactElement, interactor: ReactElement }) => {

	let [ hovered, setHovered ] = useState(false)
	const context = useContext(ChapterContext)

	// If there's no marginal selected or this is different from the current selection, this is hidden.
	function isHidden() { 
		return context.marginalID === null || context.marginalID !== props.id
	}

	function toggle() {

		if(context.setMarginal) {
			if(isMobile() && isHidden())
				context.setMarginal(props.id);
			// Otherwise, deselect.
			else
				context.setMarginal(undefined);
		}

	}

	const handleEnter = () => setHovered(true)
	const handleExit = () => setHovered(false)

	useEffect(() => {

		const mediaWatch = watchMobile()
		mediaWatch.addEventListener("change", toggle)

		return () => {
			mediaWatch.removeEventListener("change", toggle)
		}

	}, [])

	return (
		<span>
			<span 
				className={"bookish-marginal-interactor" + (hovered ? " bookish-marginal-hovered" : "") + (isHidden() ? "" : " bookish-marginal-selected")} 
				onClick={toggle} 
				onMouseEnter={handleEnter} 
				onMouseLeave={handleExit}
			>
				{props.interactor}
			</span>
			<span className={"bookish-marginal" + (isHidden() ? " bookish-marginal-hidden" : "") + (hovered ? " bookish-marginal-hovered" : "")} onClick={toggle} onMouseEnter={handleEnter} onMouseLeave={handleExit}>
				{props.content}
			</span>
		</span>
	)
}

export default Marginal