import React from "react"

export default function BookPreview(props) {
	return <div className="bookish-app-book-preview">
		{props.book.title}
	</div>
}