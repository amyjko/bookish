import React, { useContext } from "react"
import Edition from "../../models/book/Edition"
import { ChapterNode } from "../../models/chapter/ChapterNode"
import Parser from "../../models/chapter/Parser"
import ChapterBody from "../chapter/ChapterBody"
import BookishEditor from "../editor/BookishEditor"
import { EditorContext } from "./EditorContext"
import Instructions from "./Instructions"

const Acknowledgements = (props: { book: Edition }) => {

	const { editable } = useContext(EditorContext)

	const acknowledgementsHeader = <h2 className="bookish-header" id="acknowledgements">Acknowledgements</h2>
	const book = props.book
	const acksNode = Parser.parseChapter(book, book.getAcknowledgements());

	return <>
		<Instructions>
			This section is not shown if empty.
			But surely you have someone to thank!
		</Instructions>

		{/* If editable, show acknowledgements even if they're empty, otherwise hide */}
		{
			editable ? 
				<>
					{ acknowledgementsHeader }
					<BookishEditor<ChapterNode> 
						ast={acksNode} 
						save={(node: ChapterNode) => book.setAcknowledgements(node.toBookdown())}
						chapter={false}
						render={node => <ChapterBody node={node} placeholder="Who would you like to thank?"/>}
					/>
				</>
				:
				book.getAcknowledgements() ?
					<>
						{ acknowledgementsHeader }
						<ChapterBody node={acksNode}/>
					</>
					: null
		}
	</>
}

export default Acknowledgements