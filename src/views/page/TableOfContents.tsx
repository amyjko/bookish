import React, { useEffect, useState, useContext } from 'react'
import { Link } from 'react-router-dom'

import Header from "./Header"
import Authors from "../chapter/Authors"
import Page from './Page'
import Parser from "../../models/chapter/Parser"
import { EmbedNode } from "../../models/chapter/EmbedNode"
import Edition from '../../models/book/Edition'
import Outline from './Outline'
import Acknowledgements from './Acknowledgements'
import License from './License'
import Description from './Description'
import { Revisions } from './Revisions'
import Toggle from '../editor/Toggle'
import Chapter from '../../models/book/Chapter'
import TextEditor from '../editor/TextEditor'
import ConfirmButton from '../editor/ConfirmButton'
import Instructions from './Instructions'
import { EditorContext } from './EditorContext'
import { BaseContext } from './BaseContext'
import ChapterIDs from '../../models/book/ChapterID'
import Book from '../../models/book/Book'
import { subdomainIsAvailable } from '../../models/Firestore'
import { RoutesContext } from '../../App'

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

const TableOfContents = (props: { edition: Edition }) => {

	const { base } = useContext(BaseContext)
	const { editable } = useContext(EditorContext)

	// Always start at the top of the page.
	useEffect(() => {
		window.scrollTo(0, 0)
	}, [])

	// Get the book being rendered.
	const edition = props.edition;
	const book = edition.getBook();

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
		if(embed === null)
			return null;

		let embedNode = Parser.parseEmbed(edition, embed);
		return embedNode instanceof EmbedNode ? 
			<TableOfContentsImage embed={embedNode} /> :
			null;

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
			before={
				<span>
				{/* Add an editable subdomain if in editor mode */}
				{
					editable && book ?
						<SubdomainEditor book={book} />
						:
						null
				}
				</span>
			}
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

		<Instructions>
			Above you can edit your book's authors, title, and cover image.
		</Instructions>

		<Description book={edition} />

		<Instructions>
			This will appear on the <Link to={base + "/read"}>book browsing</Link> page and in your table of contents.
			Write an informative description of what your book is about.
		</Instructions>

		<h2 className="bookish-header" id="chapters">Chapters { editable ? <AddChapter/> : null }</h2>

		<Instructions>
			Add, remove, and reorder chapters here.
			You can add optional book sections to each chapter, toggle chapters as numbered/unnumbered or published/forthcoming.
			Click the title to edit the chapter.
		</Instructions>

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
								image={getImage(edition.getImage(ChapterIDs.ReferencesID))}
								chapterID={ChapterIDs.ReferencesID}
								title="References"
								annotation="Everything cited"
							/> 
							: null
					}
					{
						edition.getGlossary() && Object.keys(edition.getGlossary()).length > 0 || editable ?
							<TableOfContentsRow
								image={getImage(edition.getImage(ChapterIDs.GlossaryID))}
								chapterID={ChapterIDs.GlossaryID}
								title="Glossary"
								annotation="Definitions"
							/> 
							: null
					}
					<TableOfContentsRow
						image={getImage(edition.getImage(ChapterIDs.IndexID))}
						chapterID={ChapterIDs.IndexID}
						title="Index"
						annotation="Common words and where they are"
					/>
					<TableOfContentsRow
						image={getImage(edition.getImage(ChapterIDs.SearchID))}
						chapterID={ChapterIDs.SearchID}
						title="Search"
						annotation="Find where words occur"
					/>
					<TableOfContentsRow
						image={getImage(edition.getImage(ChapterIDs.MediaID))}
						chapterID={ChapterIDs.MediaID}
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
					{
						editable ?
							<TableOfContentsRow
							image={getImage(edition.getImage(ChapterIDs.UnknownID))}
							chapterID="unknown"
							title="Unknown"
							annotation="Customize bad links."
						/> : null
					}
				</tbody>
			</table>
		</div>

		<Acknowledgements book={edition} />
		<License book={edition} />

		<h2 className="bookish-header" id="print">Print</h2>

		<Instructions>
			This offers a way for readers to print the entire book as a single page.
		</Instructions>

		<p>
			Want to print this book or generate a PDF? 
			See <Link to={base + "print"}>all chapters on a single page</Link> and then print or export.
			Long books can take some time to render.
		</p>

		<h2 className="bookish-header" id="citation">Citation</h2>

		<Instructions>
			This citation is dynamically created from the current authors, title, and date.
		</Instructions>

		<p>
			{ edition.getAuthors().map(author => Parser.parseFormat(edition, author).toText()).join(", ") } ({(new Date()).getFullYear() }). <em>{edition.getTitle()}</em>. { location.protocol+'//'+location.host+location.pathname }, <em>retrieved { (new Date()).toLocaleDateString("en-US")}</em>.
		</p>

		<Revisions edition={edition} />
		
	</Page>

}

const TableOfContentsImage = (props: { embed: EmbedNode }) => {

	const { embed } = props;

	return <img 
		style={{width: "5em"}} 
		src={embed.getSmallURL() }
		alt={props.embed.getDescription() }
	/>

}

const AddChapter = () => {

	const { edition: book } = useContext(EditorContext)
	const [ waiting, setWaiting ] = useState(false)

	function add() {
		if(book) {
			setWaiting(true)
			book.addChapter().then(() => setWaiting(false));
		}
	}

	return <button disabled={waiting || book === undefined} onClick={add}>+</button>

}

const SubdomainEditor = (props: { book: Book }) => {

	const routes = useContext(RoutesContext);

	const invalidNames = 
		// Find the first part of the path
		routes.map(route => route.path.split("/")[1])
		// Filter out the undefined, wildcard, or book name paths, and duplicates
		.filter((path, index, paths) => path !== undefined && path !== "*" && !path.startsWith(":") && paths.lastIndexOf(path) <= index);

	return <span className="bookish-muted">
		<TextEditor 
			text={props.book.getSubdomain() ?? ""} 
			label="Book domain editor"
			save={
				// Save the new domain
				async domain => {
					const available = await subdomainIsAvailable(domain, props.book);
					if(available)
						props.book.setSubdomain(domain);
					else throw Error("Domain isn't available");
				}
			}
			placeholder="book domain"
			valid={(newDomain) =>
				// If not the empty string, must be a valid URL subdomain, and none of the existing routes.
				invalidNames.includes(newDomain) || (newDomain.length > 0 && !/^[A-Za-z0-9](?:[A-Za-z0-9\-]{0,61}[A-Za-z0-9])?$/.test(newDomain)) ? `Book domains must be fewer than 63 characters, made of symbols a-z, A-Z, and 0-9, and not one of ${invalidNames.join(", ")}.` :
				undefined
			}
			saveOnExit={true}
		/>
		<br/>
	</span>

}

export default TableOfContents