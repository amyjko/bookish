import React, { useContext } from "react"
import Edition from "../../models/book/Edition"
import { FormatNode } from "../../models/chapter/FormatNode"
import Parser from "../../models/chapter/Parser"
import Format from "../chapter/Format"
import { renderNode } from "../chapter/Renderer"
import BookishEditor from "../editor/BookishEditor"
import { EditorContext } from "./Edition"
import Instructions from "./Instructions"

const License = (props: { book: Edition }) => {

	const { editable } = useContext(EditorContext)
	const book = props.book
	const formatNode = Parser.parseFormat(book, book.getLicense()).withTextIfEmpty();

	return <>
		<h2 className="bookish-header" id="license">License</h2>

		<Instructions>
			By default of U.S. Copyright Law, your content copyrighted and owned by all authors. 
			Edit this if you'd like to grant different rights.
		</Instructions>

		{
			editable ?
			<>
				<BookishEditor<FormatNode> 
					ast={formatNode} 
					save={(node: FormatNode) => book.setLicense(node.toBookdown())}
					chapter={false}
					autofocus={false}
					render={ node => <Format node={node} placeholder="In the U.S., all rights reserved by default."/>}
				/>
			</>
			:
			<p>{ renderNode(formatNode) }</p>
		}
	</>

}

export default License