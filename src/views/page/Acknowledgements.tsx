import React, { useContext } from "react"
import Book from "../../models/Book"
import Parser from "../../models/Parser"
import { renderNode } from "../chapter/Renderer"
import TextEditor from "../editor/TextEditor"
import { EditorContext } from "./Book"

const Acknowledgements = (props: { book: Book }) => {

	const { editable } = useContext(EditorContext)

	const acknowledgementsHeader = <h2 className="bookish-header" id="acknowledgements">Acknowledgements</h2>
	const book = props.book

	return <>
		{/* If editable, show acknowledgements even if they're empty, otherwise hide */}
		{
			editable ? 
				<>
					{ acknowledgementsHeader }
					<TextEditor 
						label="Acknowledgements"
						text={book.getAcknowledgements()}
						multiline
						save={text => book.setAcknowledgements(text)}
					>
						{ book.getAcknowledgements() ? 
							renderNode(Parser.parseChapter(book, book.getAcknowledgements())) :
							<em>Click to write acknowledgements.</em>
						}
					</TextEditor>
				</>
				:
				book.getAcknowledgements() ?
					<>
						{ acknowledgementsHeader }
						{ renderNode(Parser.parseChapter(book, book.getAcknowledgements())) }
					</>
					: null
		}
	</>
}

export default Acknowledgements