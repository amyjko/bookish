import React from "react"
import { Link } from "react-router-dom"

export default function BookPreview(props) {
	return <Link to={"/read/" + props.book.id}>
		<div className="bookish-app-book-preview">
			{props.book.title}
		</div>
	</Link>
}