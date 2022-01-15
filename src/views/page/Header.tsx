import React, { useEffect, useRef } from 'react';
import Book from '../../models/Book';

import Parser from "../../models/Parser";
import { renderNode } from '../chapter/Renderer'

type HeaderProps = {
	book: Book;
	header: string;
	subtitle?: string;
	before?: React.ReactNode;
	after?: React.ReactNode;
	print?: boolean;
	tags?: string[];
	image: string | undefined;
	outline: React.ReactNode;
}

const Header = (props: HeaderProps) => {

	const title = useRef<HTMLHeadingElement | null>(null)
	const reminder = useRef<HTMLDivElement>(null)

	function updateScrollReminder() {
		if(title.current && reminder.current) {
			// If the bottom of the window is below the top of the title, hide the reminder.
			if(window.scrollY + window.innerHeight > title.current.getBoundingClientRect().top + window.scrollY)
				reminder.current.classList.add("bookish-past-title");
			else
				reminder.current.classList.remove("bookish-past-title");
		}
	}

    useEffect(() => {

		// When the title becomes visible or hidden, update the scroll reminder.
		const intersectionObserver = new IntersectionObserver((entries) => updateScrollReminder())
		if(title.current) intersectionObserver.observe(title.current)
		updateScrollReminder()

		return () => {
			if(title.current)
				intersectionObserver.unobserve(title.current)
		}

	}, [])

	return (
		<div className="bookish-chapter-header">
			{
				props.image ?
					<div className="bookish-figure-full">
						{ renderNode(Parser.parseEmbed(props.book, props.image)) }
						{ props.print ? null : <div ref={reminder} className="bookish-scroll-reminder"></div> }
					</div> :
					// Add a bit of space to account for the lack of an image.
					<p>&nbsp;</p>
			}
			{ props.outline }
			<div className="bookish-chapter-header-text">
				{ props.before }
				<h1 ref={title} className="bookish-title">{props.header}</h1>
				{ props.subtitle ? <h2 className="bookish-subtitle">{props.subtitle}</h2> : null }
				{ props.after }
				{ props.tags ? 
					<div>{props.tags.map((tag, index) => <span key={"tag-" + index} className="bookish-tag">{tag}</span>)}</div> : 
					null }
			</div>
		</div>
	);

}

export default Header