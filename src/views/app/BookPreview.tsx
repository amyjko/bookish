import { Link } from "react-router-dom"
import Book from "../../models/book/Book"
import { EmbedNode } from "../../models/chapter/EmbedNode";
import Parser from "../../models/chapter/Parser";
import ChapterBody from "../chapter/ChapterBody";
import Embed from "../chapter/Embed";
import ErrorMessage from "../chapter/ErrorMessage";

export default function BookPreview(props: { book: Book, write: boolean }) {
	const refID = props.book.getRefID();
	const cover = props.book.getCover();
	const authors = props.book.getAuthors();
	const description = props.book.getDescription();

	const embed = cover === null ? null : Parser.parseEmbed(undefined, cover);

	return <div className="bookish-app-book-preview">
			<div className={`bookish-app-book-preview-cover ${cover === null ? "bookish-app-book-preview-nocover" : ""}`}>
				{ embed == null ? null : embed instanceof EmbedNode ? <Embed node={embed}/> : <ErrorMessage node={embed}/> }
			</div>
			<div className="bookish-app-book-preview-title"><Link to={refID === undefined ? "" : (props.write ? "/write/" : "/read/") + refID}>{ props.book.getTitle() === "" ? <em>Untitled</em> : props.book.getTitle()}</Link></div>
			<div className="bookish-app-book-preview-authors">{ authors.length === 0 ? <em>No authors</em> : authors.map((author, index) => <span key={index}>{author}{ index !== authors.length - 1 ? <span>,&nbsp;</span> : null}</span>) }</div>
			<div className="bookish-app-book-preview-description">
				{ description.length === 0 ? <em>No description</em> : <ChapterBody node={Parser.parseChapter(undefined, description)}/> }
			</div>
		</div>
}