import { Link } from "react-router-dom"
import Book from "../../models/book/Book"
import { EmbedNode } from "../../models/chapter/EmbedNode";
import Parser from "../../models/chapter/Parser";
import ChapterBody from "../chapter/ChapterBody";
import Embed from "../chapter/Embed";
import ErrorMessage from "../chapter/ErrorMessage";
import { getSubdomainURL } from "../util/getSubdomain";

export default function BookPreview(props: { book: Book, write: boolean }) {
	const { book } = props;
	const refID = book.getRefID();
	const cover = book.getCover();
	const authors = book.getAuthors();
	const description = book.getDescription();
	const subdomain = book.getSubdomain();
	const title = book.getTitle() === "" ? <em>Untitled</em> : book.getTitle();

	const embed = cover === null ? null : Parser.parseEmbed(undefined, cover);

	return <div className="bookish-app-book-preview">
			<div className={`bookish-app-book-preview-cover ${cover === null ? "bookish-app-book-preview-nocover" : ""}`}>
				{ embed == null ? null : embed instanceof EmbedNode ? <Embed node={embed}/> : <ErrorMessage node={embed}/> }
			</div>
			<div className="bookish-app-book-preview-title">{
				subdomain === undefined || props.write ?
					<Link to={refID === undefined ? "" : (props.write ? "/write/" : "/read/") + refID}>{title}</Link> :
					<Link to={`/${subdomain}`}>{title}</Link>
			}
			</div>
			<div className="bookish-app-book-preview-authors">{ authors.length === 0 ? <em>No authors</em> : authors.map((author, index) => <span key={index}>{author}{ index !== authors.length - 1 ? <span>,&nbsp;</span> : null}</span>) }</div>
			<div className="bookish-app-book-preview-description">
				{ description.length === 0 ? <em>No description</em> : <ChapterBody node={Parser.parseChapter(undefined, description)}/> }
			</div>
		</div>
}