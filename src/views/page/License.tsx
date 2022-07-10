import React, { useContext } from "react"
import Edition from "../../models/book/Edition"
import { FormatNode } from "../../models/chapter/FormatNode"
import Parser from "../../models/chapter/Parser"
import { renderNode } from "../chapter/Renderer"
import BookishEditor from "../editor/BookishEditor"
import { EditorContext } from "./Book"

const License = (props: { book: Edition }) => {

	const { editable } = useContext(EditorContext)
	const book = props.book
	const formatNode = Parser.parseFormat(book, book.getLicense()).withTextIfEmpty();

	return <>
		<h2 className="bookish-header" id="license">License</h2>
		{
			editable ?
			<>
				<BookishEditor<FormatNode> 
					ast={formatNode} 
					save={(node: FormatNode) => book.setLicense(node.toBookdown())}
					chapter={false}
					placeholder="All rights reserved."
					autofocus={false}
				/>
			</>
			:
			<p>{ renderNode(formatNode) }</p>
		}
	</>

}

export default License