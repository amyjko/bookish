import React, { useEffect, useRef, useContext } from 'react';
import Book from '../../models/Book';
import { EmbedNode } from '../../models/EmbedNode';

import Parser from "../../models/Parser";
import { renderNode } from '../chapter/Renderer'
import BookishEditor from '../editor/BookishEditor';
import TextEditor from '../editor/TextEditor';
import { EditorContext } from './Book';

type HeaderProps = {
	book: Book;
	label: string;
	header: string;
	subtitle?: string;
	before?: React.ReactNode;
	after?: React.ReactNode;
	print?: boolean;
	tags?: string[];
	getImage: () => string | undefined;
	setImage: (embed: string | undefined) => Promise<void> | undefined
	outline: React.ReactNode;
	save?: (text: string) => Promise<void> | undefined;
}

const Header = (props: HeaderProps) => {

	const title = useRef<HTMLHeadingElement | null>(null)
	const reminder = useRef<HTMLDivElement>(null)
	const { book, editable } = useContext(EditorContext)

	function updateScrollReminder() {
		if(title.current && reminder.current) {
			// If the bottom of the window is below the top of the title, hide the reminder.
			if(window.scrollY + window.innerHeight > title.current.getBoundingClientRect().top + window.scrollY)
				reminder.current.classList.add("bookish-past-title");
			else
				reminder.current.classList.remove("bookish-past-title");
		}
	}

	function addCover() { props.setImage("|||||"); }
	function removeCover() { props.setImage(undefined); }

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

	const titleView = <>
		{props.header}
		{ props.subtitle ? <div className="bookish-subtitle">{props.subtitle}</div> : null }
	</>

	const embed = props.getImage();
	const embedNode = embed ? Parser.parseEmbed(props.book, embed) : undefined;

	return (
		<div className="bookish-chapter-header">
			{
				embedNode ?
					<div className="bookish-figure-full">
						{
							book && editable && embedNode instanceof EmbedNode ?
								<BookishEditor 
									ast={embedNode} 
									save={(node: EmbedNode) => props.setImage(node.toBookdown())}
									chapter={false}
									placeholder=""
									autofocus={false}
								/> :
								renderNode(embedNode)
						}
						{ props.print ? null : <div ref={reminder} className="bookish-scroll-reminder"></div> }
					</div> :
					// Add a bit of space to account for the lack of an image.
					<p>&nbsp;</p>
			}
			{ props.outline }
			{
				editable ?
					embedNode === undefined ?
						<button onClick={addCover}>+ cover image</button> :
						<button onClick={removeCover}>x cover image</button> :
					null
			}
			<div className="bookish-chapter-header-text">
				{ props.before }
				<h1 ref={title} className="bookish-title">
				{
					editable && props.save ? 
						<TextEditor 
							label={props.label}
							text={props.header + (props.subtitle ? ": " + props.subtitle : "")}
							placeholder="Title"
							valid={text => text.length === 0 ? "Titles have to be at least one character long." : undefined }
							save={props.save}
						/>
						: 
						titleView
				}
				</h1>
				{ props.after }
				{ props.tags ? 
					<div>{props.tags.map((tag, index) => <span key={"tag-" + index} className="bookish-tag">{tag}</span>)}</div> : 
					null }
			</div>
		</div>
	);

}

export default Header