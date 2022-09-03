import React from "react"
import { Link } from "react-router-dom"
import Book from "../../models/book/Book"
import Parser from "../../models/chapter/Parser";
import { renderNode } from "../chapter/Renderer";

export default function BookPreview(props: { book: Book, write: boolean }) {
	const refID = props.book.getRefID();
	const cover = props.book.getCover();
	const authors = props.book.getAuthors();
	const description = props.book.getDescription();

	return <div className="bookish-app-book-preview">
			<div className={`bookish-app-book-preview-cover ${cover === null ? "bookish-app-book-preview-nocover" : ""}`}>
				{ cover == null ? null : renderNode(Parser.parseEmbed(undefined, cover)) }
			</div>
			<div className="bookish-app-book-preview-title"><Link to={refID === undefined ? "" : (props.write ? "/write/" : "/read/") + refID}>{ props.book.getTitle() === "" ? <em>Untitled</em> : props.book.getTitle()}</Link></div>
			<div className="bookish-app-book-preview-authors">{ authors.length === 0 ? <em>No authors</em> : authors.map((author, index) => <span key={index}>{author}{ index !== authors.length - 1 ? <span>,&nbsp;</span> : null}</span>) }</div>
			<div className="bookish-app-book-preview-description">
				{ description.length === 0 ? <em>No description</em> : renderNode(Parser.parseChapter(undefined, description)) }
			</div>
		</div>
}