import React from "react"

export default function BookPreview(props) {
	return <div className="book-preview">
		{props.book.title}
	</div>
}