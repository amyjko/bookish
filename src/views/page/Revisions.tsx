import React, { useContext } from "react"
import Edition from "../../models/book/Edition"
import Parser from "../../models/chapter/Parser"
import { renderNode } from "../chapter/Renderer"
import { EditorContext } from "./Book"

const Revisions = (props: { book: Edition }) => {

	const { editable } = useContext(EditorContext)
	const book = props.book

	return <>
		{
			book.getRevisions().length === 0 ? 
				null :
				<>
					<h2 className="bookish-header" id="revisions">Revisions</h2>
					<ul>
						{book.getRevisions().map((revision, index) => {
							return <li key={"revision" + index}><em>{revision[0]}</em>. { renderNode(Parser.parseFormat(book, revision[1])) }</li>;
						})}
					</ul>
				</>	
		}
	</>

}

export default Revisions