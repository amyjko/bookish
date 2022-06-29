import React, { useContext } from "react"
import Book from "../../models/Book"
import { ChapterNode } from "../../models/ChapterNode"
import { FormatNode } from "../../models/FormatNode"
import Parser from "../../models/Parser"
import { renderNode } from "../chapter/Renderer"
import BookishEditor from "../editor/BookishEditor"
import { EditorContext } from "./Book"

const Description = (props: { book: Book }) => {

	const { editable } = useContext(EditorContext)
	const book = props.book
	const descriptionNode = Parser.parseChapter(book, book.getDescription());

	return <>
		<div className="bookish-description">
		{
			editable ? 
				<BookishEditor 
					ast={descriptionNode} 
					save={(node: ChapterNode | FormatNode) => book.setDescription(node.toBookdown())}
				/>
				:
				renderNode(descriptionNode)
		}
		</div>
	</>

}

export default Description