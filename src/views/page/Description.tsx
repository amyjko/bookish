import React, { useContext } from "react"
import Edition from "../../models/book/Edition"
import { ChapterNode } from "../../models/chapter/ChapterNode"
import { FormatNode } from "../../models/chapter/FormatNode"
import Parser from "../../models/chapter/Parser"
import ChapterBody from "../chapter/ChapterBody"
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
					save={node => book.setDescription(node.toBookdown())}
					chapter={false}
					autofocus={false}
					render={ node => <ChapterBody node={node} placeholder="What this book about?"/> }
				/>
				:
				renderNode(descriptionNode)
		}
		</div>
	</>

}

export default Description