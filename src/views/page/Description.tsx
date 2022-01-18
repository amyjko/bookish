import React, { useContext } from "react"
import Book from "../../models/Book"
import Parser from "../../models/Parser"
import { renderNode } from "../chapter/Renderer"
import TextEditor from "../editor/TextEditor"
import { EditorContext } from "./Book"

const Description = (props: { book: Book }) => {

	const { editable } = useContext(EditorContext)
	const book = props.book
	const description = renderNode(Parser.parseChapter(book, book.getDescription()))

	return <>
		<div className="bookish-description">
		{
			editable ? 
				<>
					<TextEditor 
						label="Book description"
						text={book.getDescription()}
						multiline
						save={text => book.setDescription(text)}
					>
					{ description }
					</TextEditor>
				</>
				:
				description
		}
		</div>
	</>

}

export default Description