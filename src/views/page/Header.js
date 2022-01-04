import React, { useEffect } from 'react';

import Parser from "../../models/Parser";
import { renderNode } from '../chapter/Renderer'

export default function Header(props) {

	function updateScrollReminder() {
		let title = document.getElementById("bookish-title");
		let reminder = document.getElementById("bookish-scroll-reminder");
		if(title && reminder) {
			// If the bottom of the window is below the top of the title, hide the reminder.
			if(window.scrollY + window.innerHeight > title.getBoundingClientRect().top + window.scrollY)
				reminder.classList.add("bookish-past-title");
			else
				reminder.classList.remove("bookish-past-title");
		}
	}

    useEffect(() => {

		// When the title becomes visible or hidden, update the scroll reminder.
		const intersectionObserver = new IntersectionObserver((entries) => updateScrollReminder())
		const title = document.getElementById("bookish-title")
		if(title) intersectionObserver.observe(title)
		updateScrollReminder()

		return () => {
			intersectionObserver.unobserve(title)
		}

	}, [])

	let tags = props.tags;

	return (
		<div className="bookish-chapter-header">
			{
				props.image ?
					<div className="bookish-figure-full">
						{ renderNode(Parser.parseEmbed(props.book, props.image)) }
						{ props.print ? null : <div id="bookish-scroll-reminder"></div> }
					</div> :
					// Add a bit of space to account for the lack of an image.
					<p>&nbsp;</p>
			}
			{ props.outline }
			<div className="bookish-chapter-header-text">
				{ props.before }
				<h1 id="bookish-title" className="bookish-title">{props.header}</h1>
				{ props.subtitle ? <h2 className="bookish-subtitle">{props.subtitle}</h2> : null }
				{ props.after }
				{ tags ? 
					<div>{props.tags.map((tag, index) => <span key={"tag-" + index} className="bookish-tag">{tag}</span>)}</div> : 
					null }
			</div>
		</div>
	);

}