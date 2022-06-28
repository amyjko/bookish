import React, { useContext } from "react"
import Book from "../../models/Book"
import Parser from "../../models/Parser"
import { renderNode } from "../chapter/Renderer"
import TextEditor from "../editor/TextEditor"
import { EditorContext } from "./Book"

const License = (props: { book: Book }) => {

	const { editable } = useContext(EditorContext)
	const book = props.book

	return <>
		<h2 className="bookish-header" id="license">License</h2>
		<p>
		{
			editable ?
			<>
				<TextEditor 
					label="License"
					text={book.getLicense()}
					multiline
					save={text => book.setLicense(text)}
				>
					{ renderNode(Parser.parseFormat(book, book.getLicense())) }
				</TextEditor>
			</>
			:
			renderNode(Parser.parseFormat(book, book.getLicense()))

		}
		</p>
	</>

}

export default License