import React from "react"
import { Link } from "react-router-dom"
import Book from "../../models/book/Book"

export default function BookPreview(props: { book: Book, write: boolean }) {
	const refID = props.book.getRefID();
	return <Link to={refID === undefined ? "" : (props.write ? "/write/" : "/read/") + refID}>
		<div className="bookish-app-book-preview">
			{props.book.getTitle() === "" ? <em>Untitled</em> : props.book.getTitle()}
		</div>
	</Link>
}