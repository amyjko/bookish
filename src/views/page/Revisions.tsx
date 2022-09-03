import React, { useContext } from "react"
import Edition from "../../models/book/Edition"
import Parser from "../../models/chapter/Parser"
import { addDraftInFirestore, deleteEditionInFirestore, publishDraftInFirestore } from "../../models/Firestore"
import { renderNode } from "../chapter/Renderer"
import BookishEditor from "../editor/BookishEditor"
import Switch from "../editor/Switch"
import { EditorContext } from "./Edition"

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

	function handleDeleteEdition(index: number) {
		if(book === undefined) return;
		deleteEditionInFirestore(book, index);
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
								<li key={"revision" + index}><em>{revision[0]}</em>. { renderNode(Parser.parseFormat(edition, revision[1])) }</li>
							)
						}						
					</ul>
				</>	
		}
		{
			book && bookRevisions ?
			<>
				<h2 className="bookish-header" id="revisions">Editions <button onClick={handleDraftEdition}>+</button></h2>
				{ 
					editable ?
						<div className="bookish-instructions">
							<p>
								Each book has one or more editions, allowing you to track revisions and ensure previous versions remain available.
							</p>
							<ul>
								<li>Add an edition before making revisions.</li>
								<li>Add descriptions of revisions so readers know what's changed.</li>
								<li>Draft editions aren't visible until they are published.</li>
								<li>You can delete an edition, unless it's the last one.</li>
							</ul> 
						</div>
						: null			
				}				
				<table className="bookish-table">
					<colgroup>
						<col width="5%" />
						<col width="20%" />
						<col width="40%" />
						<col width="35%" />
					</colgroup>
					<tbody>
						{
							bookRevisions.map((revision, index) => 
								// We don't show the latest draft since it has no summary yet.
								!editable && !revision.published ? 
									null : 
									<tr key={`revision-${revision.ref.id}`}>
										<td>
											{
												editable ?
													<button onClick={() => handleDeleteEdition(index)} disabled={edition.getRef()?.id === revision.ref.id || bookRevisions.length === 1}>-</button> : 
													null
											}
										</td>
										<td>
											<a href={`/write/${revision.ref.id}`}>{(new Date(revision.time).toLocaleDateString("en-us"))}</a>
											{
												revision === bookRevisions.find(e => e.published) ?
													<span><br/><em className="bookish-app-chrome-muted">Live</em></span> : 
													null
											}
											{
												revision.ref.id === edition.getRef()?.id ?
													<span><br/><em className="bookish-app-chrome-muted">Editing</em></span> : 
													null
											}
										</td>
										<td>{
											editable ? 
												<BookishEditor 
													ast={Parser.parseFormat(undefined, revision.summary).withTextIfEmpty()}
													save={ newSummary => book.setEditionChangeSummary(newSummary.toBookdown(), index) } 
													chapter={false}
													placeholder={"Summarize this edition's changes."} 
													autofocus={false}
												/> : 
											revision.summary === "" ? <em>No summary of changes</em> : 
											revision.summary}
										</td>
										<td>
											{
												editable ?
													<Switch 
														options={["draft", "published"]} 
														enabled={revision.published || revision.summary !== ""}
														value={revision.published ? "published" : "draft"} 
														edit={ published => handlePublish(index, published === "published") }
													/>
												: null
											}
										</td>
									</tr>
							)
						}
					</tbody>
				</table>
			</>
			: null
		}
	</>

}