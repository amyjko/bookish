import React from "react"
import { Link } from "react-router-dom"
import { BookSpecification } from "../../models/Book"

export default function BookPreview(props: { book: BookSpecification }) {
	return <Link to={"/read/" + props.book.id}>
		<div className="bookish-app-book-preview">
			{props.book.title}
		</div>
	</Link>
}