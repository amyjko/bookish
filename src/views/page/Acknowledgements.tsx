import React, { useContext } from "react"
import Book from "../../models/Book"
import { ChapterNode } from "../../models/ChapterNode"
import Parser from "../../models/Parser"
import { renderNode } from "../chapter/Renderer"
import BookishEditor from "../editor/BookishEditor"
import { EditorContext } from "./Book"

const Acknowledgements = (props: { book: Book }) => {

	const { editable } = useContext(EditorContext)

	const acknowledgementsHeader = <h2 className="bookish-header" id="acknowledgements">Acknowledgements</h2>
	const book = props.book
	const acksNode = Parser.parseChapter(book, book.getAcknowledgements());

	return <>
		{/* If editable, show acknowledgements even if they're empty, otherwise hide */}
		{
			editable ? 
				<>
					{ acknowledgementsHeader }
					<BookishEditor<ChapterNode> 
						ast={acksNode} 
						save={(node: ChapterNode) => book.setAcknowledgements(node.toBookdown())}
						chapter={false}
						autofocus={false}
					/>
				</>
				:
				book.getAcknowledgements() ?
					<>
						{ acknowledgementsHeader }
						{ renderNode(acksNode) }
					</>
					: null
		}
	</>
}

export default Acknowledgements