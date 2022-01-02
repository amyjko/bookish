import React, { useEffect } from 'react';

import Parser from "../../models/Parser";
import { renderNode } from '../chapter/Renderer'

export default function Header(props) {

    function showScrollReminder() {

        // Tag things "past-title" if we're past it, so they can react to position.
        let title = document.getElementById("title");
        let reminder = document.getElementById("bookish-scroll-reminder");
        if(title && reminder) {
            if(window.scrollY + window.innerHeight > title.getBoundingClientRect().top + window.scrollY)
                reminder.classList.add("past-title");
            else
                reminder.classList.remove("past-title");
        }
    
    }

	// When mounted, start listening to scrolling and resizing to position the scroll reminder.
    useEffect(() => {
		
		// Listen for window changes to show a scroll reminder
		window.addEventListener('scroll', showScrollReminder);
		window.addEventListener('resize', showScrollReminder);

		// Position the scroll reminder.
		showScrollReminder()

		return () => {
			window.removeEventListener('scroll', showScrollReminder);
			window.removeEventListener('resize', showScrollReminder);	
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
				<h1 id="title" className="bookish-title">{props.header}</h1>
				{ props.subtitle ? <h2 className="bookish-subtitle">{props.subtitle}</h2> : null }
				{ props.after }
				{ tags ? 
					<div>{props.tags.map((tag, index) => <span key={"tag-" + index} className="bookish-tag">{tag}</span>)}</div> : 
					null }
			</div>
		</div>
	);

}