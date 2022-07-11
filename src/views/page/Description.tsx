import React, { useContext } from "react"
import Edition from "../../models/book/Edition"
import { ChapterNode } from "../../models/chapter/ChapterNode"
import { FormatNode } from "../../models/chapter/FormatNode"
import Parser from "../../models/chapter/Parser"
import { renderNode } from "../chapter/Renderer"
import BookishEditor from "../editor/BookishEditor"
import { EditorContext } from "./Edition"

const Description = (props: { book: Edition }) => {

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
					chapter={false}
					placeholder="What this book about?"
					autofocus={false}
				/>
				:
				renderNode(descriptionNode)
		}
		</div>
	</>

}

export default Description