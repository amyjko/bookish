import React, { useContext } from "react"
import Book from "../../models/Book"
import { FormatNode } from "../../models/FormatNode"
import Parser from "../../models/Parser"
import { renderNode } from "../chapter/Renderer"
import BookishEditor from "../editor/BookishEditor"
import { EditorContext } from "./Book"

const License = (props: { book: Book }) => {

	const { editable } = useContext(EditorContext)
	const book = props.book
	const formatNode = Parser.parseFormat(book, book.getLicense());

	return <>
		<h2 className="bookish-header" id="license">License</h2>
		{
			editable ?
			<>
				<BookishEditor<FormatNode> 
					ast={formatNode} 
					save={(node: FormatNode) => book.setLicense(node.toBookdown())}
					chapter={false}
				/>
			</>
			:
			<p>{ renderNode(formatNode) }</p>
		}
	</>

}

export default License