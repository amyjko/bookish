import React, { useEffect, useState, useContext } from 'react'
import { Link } from 'react-router-dom'

import Header from "./Header"
import Authors from "../chapter/Authors"
import Page from './Page'
import Parser from "../../models/chapter/Parser"
import { EmbedNode } from "../../models/chapter/EmbedNode"
import Edition from '../../models/book/Edition'
import Outline from './Outline'
import { BaseContext, EditorContext } from './Edition'
import Acknowledgements from './Acknowledgements'
import License from './License'
import Description from './Description'
import { Revisions } from './Revisions'
import Toggle from '../editor/Toggle'
import Chapter from '../../models/book/Chapter'
import TextEditor from '../editor/TextEditor'
import ConfirmButton from '../editor/ConfirmButton'

const TableOfContentsRow = (props: { 
	image: React.ReactNode, 
	chapterID: string,
	chapter?: Chapter,
	title: string, 
	number?: number,
	annotation?: React.ReactNode, 
	forthcoming?: boolean, 
	etc?: React.ReactNode
}) => {

	const { base } = useContext(BaseContext)
	const { editable } = useContext(EditorContext)

	const chapter = props.chapter

	function moveUp() { chapter?.move(-1) }
	function moveDown() { chapter?.move(1) }

	return <>
		<tr className={props.forthcoming ? "bookish-forthcoming" : ""}>
			<td>{props.image}</td>
			<td>
				{ editable && chapter ? 
					<Toggle on={props.number !== undefined} save={ on => chapter.setNumbered(on) }>
						<div className="bookish-chapter-number">{props.number ? "Chapter " + props.number : <span className="bookish-muted">Unnumbered</span>}</div>
					</Toggle>
					:
					props.number ? 
						<div className="bookish-chapter-number">{"Chapter " + props.number}</div> : 
						null
				}
				{ props.forthcoming && !editable ?
					<span>{props.title}</span> :
					<Link to={base + "/" + props.chapterID}>{props.title}</Link>
				}
				{ props.annotation ? <small className="bookish-muted"><br/><em>{props.annotation}</em></small> : null }
			</td>
			<td>{props.etc}</td>
			{
				editable ?
					chapter ?
						<td>
							<button disabled={chapter.getPosition() === 0} onClick={moveUp}>{"↑"}</button>
							&nbsp;
							<button disabled={chapter.getPosition() === chapter.getBook().getChapterCount() - 1} onClick={moveDown}>{"↓"}</button>
							&nbsp;
							<ConfirmButton
								commandLabel="x"
								confirmLabel="Confirm"
								command={() => chapter.delete()}
							/>
						</td> 
						:
						<td></td>					
					:
					null
			}
		</tr>
	</>

}

const AddChapter = () => {

	const { edition: book } = useContext(EditorContext)
	const [ waiting, setWaiting ] = useState(false)

	function add() {
		if(book) {
			setWaiting(true)
			let add = book.addChapter();
			if(add)
				add.then(() => { setWaiting(false); })
		}
	}

	return <button disabled={waiting || book === undefined} onClick={add}>+</button>

}

const TableOfContents = (props: { edition: Edition }) => {

	const { base } = useContext(BaseContext)
	const { editable } = useContext(EditorContext)

	// Always start at the top of the page.
	useEffect(() => {
		window.scrollTo(0, 0)
	}, [])

	// Get the book being rendered.
	let edition = props.edition;

	function getProgressDescription(progress: null | number) {

		if(progress === null)
			return "";
		else if(progress === 0)
			return "";
		else if(progress < 30)
			return "; just started";
		else if(progress < 70)
			return "; halfway";
		else if(progress < 95)
			return "; almost done";
		else
			return "; done";

	}

	function getImage(embed: string | null) {

		// No image? Return null for React to render nothing.
		if(!embed)
			return null;

		let embedNode = Parser.parseEmbed(edition, embed);
		if(embedNode instanceof EmbedNode) {
			let image = (embedNode as EmbedNode).toJSON();
			return <TableOfContentsImage url={image.url} alt={image.alt}/>
		}
		else return null;

	}

	// Get the chapter progress
	let progressStorage = localStorage.getItem("chapterProgress");
	let progress = progressStorage === null ?
		{} :
		JSON.parse(progressStorage)

	// Is there a colon? Let's make a subtitle
	let title = edition.getTitle();
	let subtitle = undefined;
	let colon = title.indexOf(":");
	if(colon >= 0) {
		subtitle = title.substring(colon + 1).trim();
		title = title.substring(0, colon).trim();
	}

	return <Page>
		<Header 
			book={edition}
			label="Book title"
			getImage={() => edition.getImage("cover")}
			setImage={embed => edition.setImage("cover", embed)}
			header={title}
			subtitle={subtitle}
			tags={edition.getTags()}
			after={<Authors 
				authors={edition.getAuthors()} 
				add={ () => edition.addAuthor("")}
				edit={(index, text) => text.length === 0 ? edition.removeAuthor(index) : edition.setAuthor(index, text)} 
			/>}
			outline={
				<Outline
					previous={null}
					next={edition.getNextChapterID("")}
				/>
			}
			save={text => props.edition.setTitle(text)}
		/>

		<Description book={edition} />

		<h2 className="bookish-header" id="chapters">Chapters { editable ? <AddChapter/> : null }</h2>
		<div className="bookish-table">
			<table id="toc">
				<tbody>
					{
						edition.getChapters().map((chapter) => {

							// Get the image, chapter number, and section for rendering.
							const chapterID = chapter.getChapterID();
							const chapterAST = chapter.getAST();
							const readingTime = chapter.getReadingTime();
							const readingEstimate =
								readingTime === undefined ? "Forthcoming" :
								readingTime < 5 ? "<5 min read" :
								readingTime < 60 ? "~" + Math.floor(readingTime / 5) * 5 + " min read" :
								"~" + Math.floor(readingTime / 60) + " hour read";

							const etc = <>
								<small className="bookish-muted">
								<em>
									{ readingEstimate }
									{ !chapter.isForthcoming() && getProgressDescription(chapterID in progress ? progress[chapterID] : null) }
								</em>
								</small>
								{
									!chapter.isForthcoming() && chapterAST && chapterAST.getErrors().length > 0 ? 
										<span><br/><small className="bookish-error">{chapterAST.getErrors().length + " " + (chapterAST.getErrors().length > 1 ? "errors" : "error")}</small></span> :
										null
								}
							</>

							const section = chapter.getSection()

							return (
								<TableOfContentsRow
									key={chapterID}
									image={getImage(chapter.getImage())}
									chapter={chapter}
									chapterID={chapterID}
									number={edition.getChapterNumber(chapterID)}
									title={chapter.getTitle()}
									annotation={
										editable ?
											<TextEditor
												label={"Chapter section editor"}
												text={section ? section : ""}
												placeholder="Section"
												valid={ text => undefined }
												save={text => chapter.setSection(text) }
											/>
											:
											chapter.getSection()
									}
									forthcoming={chapter.isForthcoming()}
									etc={editable ? 
										<Toggle on={chapter.isForthcoming()} save={on => chapter.setForthcoming(on)}>
											{etc}
										</Toggle> 
										: 
										etc
									}
								/>
							)
						})
					}
					{
						edition.hasReferences() || editable ? 
							<TableOfContentsRow
								image={getImage(edition.getImage(Edition.ReferencesID))}
								chapterID="references"
								title="References"
								annotation="Everything cited"
							/> 
							: null
					}
					{
						edition.getGlossary() && Object.keys(edition.getGlossary()).length > 0 || editable ?
							<TableOfContentsRow
								image={getImage(edition.getImage(Edition.GlossaryID))}
								chapterID="glossary"
								title="Glossary"
								annotation="Definitions"
							/> 
							: null
					}
					<TableOfContentsRow
						image={getImage(edition.getImage(Edition.IndexID))}
						chapterID="index"
						title="Index"
						annotation="Common words and where they are"
					/>
					<TableOfContentsRow
						image={getImage(edition.getImage(Edition.SearchID))}
						chapterID="search"
						title="Search"
						annotation="Find where words occur"
					/>
					<TableOfContentsRow
						image={getImage(edition.getImage(Edition.MediaID))}
						chapterID="media"
						title="Media"
						annotation="Images and video in the book"
					/>
					{
						editable ?
							<TableOfContentsRow
							image={undefined}
							chapterID="theme"
							title="Theme"
							annotation="Style the book"
						/> : null
					}
				</tbody>
			</table>
		</div>

		<Acknowledgements book={edition} />
		<License book={edition} />

		<h2 className="bookish-header" id="print">Print</h2>

		<p>
			Want to print this book or generate a PDF? See <Link to={base + "print"}>all chapters on a single page</Link> and then print or export.
		</p>

		<h2 className="bookish-header" id="citation">Citation</h2>

		<p>
			{ edition.getAuthors().map(author => Parser.parseFormat(edition, author).toText()).join(", ") } ({(new Date()).getFullYear() }). <em>{edition.getTitle()}</em>. { location.protocol+'//'+location.host+location.pathname }, <em>retrieved { (new Date()).toLocaleDateString("en-US")}</em>.
		</p>

		<Revisions edition={edition} />
		
	</Page>

}

function TableOfContentsImage(props: { url: string, alt: string}) {

	return <img 
		style={{width: "5em"}} 
		// Load the small images. Big ones are too slow!
		src={props.url.startsWith("http") ? props.url : "images/small/" + props.url}
		alt={props.alt}
	/>

}

export default TableOfContents