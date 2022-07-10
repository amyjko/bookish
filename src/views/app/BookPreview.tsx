import React from "react"
import { Link } from "react-router-dom"
import { BookSpecification } from "../../models/book/Book"

export default function BookPreview(props: { book: BookSpecification, write: boolean }) {
	return <Link to={(props.write ? "/write/" : "/read/") + props.book.ref.id}>
		<div className="bookish-app-book-preview">
			{props.book.title}
		</div>
	</Link>
}