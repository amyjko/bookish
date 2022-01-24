import React from "react"
import { Link } from "react-router-dom"
import { BookPreview } from "../../models/Book"

export default function BookPreview(props: { book: BookPreview, write: boolean }) {
	return <Link to={(props.write ? "/write/" : "/read/") + props.book.ref.id}>
		<div className="bookish-app-book-preview">
			{props.book.title}
		</div>
	</Link>
}