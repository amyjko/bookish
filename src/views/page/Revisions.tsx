import React, { useContext } from "react"
import Edition from "../../models/book/Edition"
import Parser from "../../models/chapter/Parser"
import { addDraftInFirestore, publishDraftInFirestore } from "../../models/Firestore"
import Format from "../chapter/Format"
import BookishEditor from "../editor/BookishEditor"
import Switch from "../editor/Switch"
import { EditorContext } from "./EditorContext"
import Instructions from "./Instructions"

export const Revisions = (props: { edition: Edition }) => {

	const { editable } = useContext(EditorContext)

	const edition = props.edition;
	const book = edition.getBook();

	// Legacy revisions
	const editionRevisions = edition.getRevisions();

	// Book revisions
	const bookRevisions = book?.getRevisions();

	// Copy the current draft to create a new draft.
	function handlePublish(index: number, published: boolean) {

		if(book === undefined) return;
		publishDraftInFirestore(book, index, published);

	}

	function handleDraftEdition() {
		if(book === undefined) return;
		addDraftInFirestore(book);
	}

	return <>
		{
			editionRevisions.length === 0 ? 
				null :
				<>
					<h2 className="bookish-header" id="revisions">Revisions</h2>
					<ul>
						{
							editionRevisions.map((revision, index) =>
								<li key={"revision" + index}><em>{revision[0]}</em>. <Format node={Parser.parseFormat(edition, revision[1])} /></li>
							)
						}						
					</ul>
				</>	
		}
		{
			book && bookRevisions ?
			<>
				<h2 className="bookish-header" id="revisions">Editions { editable ? <button onClick={handleDraftEdition}>+</button> : null}</h2>
				<Instructions>
					Each book has one or more editions, allowing you to track revisions and ensure previous versions remain available.
					When you're ready to revise, make a new edition, then publish it when you're done.
					The edition with a * is the default edition readers will see, unless they explicitly choose to view a previous edition.
				</Instructions>
				<table className="bookish-table">
					<colgroup>
						<col width="5%" />
						<col width="5%" />
						<col width="50%" />
						<col width="35%" />
					</colgroup>
					<tbody>
						{
							bookRevisions.map((revision, index) => {

								const editionNumber = bookRevisions.length - index;
								const viewing = revision.ref.id === edition.getRef()?.id;

								// We don't show the latest draft since it has no summary yet.
								return !editable && !revision.published ? null : 
									<tr 
										key={`revision-${revision.ref.id}`} 
										className={`${!revision.published ? "bookish-edition-hidden" : ""} ${viewing ? "bookish-edition-editing": ""} `}
									>
										<td>
											<em>{ editionNumber + (editionNumber === 1 ? "st" : editionNumber === 2 ? "nd" : editionNumber === 3 ? "rd" : "th") }</em> <span className="bookish-editor-note">{(new Date(revision.time).toLocaleDateString("en-us"))}</span>
										</td>
										<td>
											{
												editable ?
													viewing ? 
														"Editing" :
														<a href={`/write/${book.ref.id}/${bookRevisions.length - index}`}>Edit</a> :
													viewing ?
														"Viewing" :
														<a href={`/read/${book.ref.id}/${bookRevisions.length - index}`}>View</a>
											}											
										</td>
										<td>
											{ 
											editable ? 
												<BookishEditor 
													ast={Parser.parseFormat(undefined, revision.summary).withTextIfEmpty()}
													save={ newSummary => book.setEditionChangeSummary(newSummary.toBookdown(), index) } 
													chapter={false}
													render={ node => <Format node={node} placeholder="Summarize this edition's changes."/>}
												/> : 
											revision.summary === "" ? 
												<em>No summary of changes</em> : 
												revision.summary
											}
										</td>
										<td style={{whiteSpace: "nowrap" }}>
											{
												editable ?
													<span>
														<Switch 
															options={["hidden", "published"]} 
															enabled={revision.published || revision.summary !== ""}
															value={revision.published ? "published" : "hidden"} 
															edit={ published => handlePublish(index, published === "published") }
														/>
													{ revision === bookRevisions.find(e => e.published) ? "*" : null}
												</span>
												: null
											}
										</td>
									</tr>
							})
						}
					</tbody>
				</table>
			</>
			: null
		}
	</>

}