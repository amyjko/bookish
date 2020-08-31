import _ from 'lodash';
import React from 'react';
import { Link } from 'react-router-dom';

import {Figure} from './image';
import {Header} from './header';

class Line {

	constructor(line) {

		this.line = line;
		this.rest = line;

	}

	more() { return this.peek() !== null; }
	peek() { return this.rest.length > 0 ? this.rest.charAt(0) : null; }
	next() { 
		if(!this.more())
			return null;
		var next = this.rest.charAt(0);
		this.rest = this.rest.substring(1);
		return next;
	}

}

class Chapter extends React.Component {

	translateSegment(line, key) {

		var segments = [];
		var line = new Line(line);
		var fragment = "";

		while(line.more()) {

			// Italic
			if(line.peek() === "_" || line.peek() === "*" || line.peek() === "^") {

				// Capture the fragment prior.
				if(fragment.length > 0) {
					segments.push(<span key={"segment" + key++}>{fragment}</span>);
					fragment = "";
				}

				// Remember what we're matching.
				var delimeter = line.peek();

				// Make an emphasis.
				var segment = "";
				line.next();
				while(line.more() && line.peek() !== delimeter)
					segment = segment + line.next();
				if(line.peek() === delimeter)
					line.next();
				segments.push(
					delimeter === "_" ?
						<em key={"segment" + key++}>{segment}</em> :
					delimeter === "*" ?
						<strong key={"segment" + key++}>{segment}</strong> :
						<em key={"segment" + key++}><strong>{segment}</strong></em>
				);

			}
			// Escape symbol
			else if(line.peek() === "\\") {

				// Skip the scape and just add the next character.
				line.next();
				fragment = fragment + line.next();

			}
			// Link
			else if(line.peek() === "[") {

				// Capture the fragment prior before processing the link.
				if(fragment.length > 0) {
					segments.push(<span key={"segment" + key++}>{fragment}</span>);
					fragment = "";
				}
				
				line.next();
				var content = "";
				var link = "";
				while(line.more() && line.peek() !== "|") {
					content = content + line.next();
				}
				if(line.peek() === "|")
					line.next();
				while(line.more() && line.peek() !== "]") {
					link = link + line.next();
				}
				if(line.peek() === "]")
					line.next();

				// If this is external, make an anchor.
				if(link.startsWith("http"))
					segments.push(<a key={"segment" + key++} href={link}>{content}</a>)
				// If this is internal, make a route link.
				else
					segments.push(<Link key={"segment" + key++} to={link}>{content}</Link>)

			}
			// Accumulate a fragment.
			else {

				fragment = fragment + line.next();

			}

		}

		if(fragment !== null)
			segments.push(<span key={"segment" + key++}>{fragment}</span>);

		return segments;

	}

	// Parse the markdown into React components.
	translate(text) {

		// For react's key prop.
		var key = 0;

		// To store the elements to return.
		var elements = [];

		// Split the text by two consecutive carriage returns.
		var lines = text.split("\n");

		// Keep an accumulator for children of each block.
		// Null means we're not tracking anything yet.
		var sequence = null;

		// Translate each line into React components.
		while(lines.length > 0) {

			// Get the next line.
			var line = lines.shift();

			var trimmed = line.trim();

			// Comment
			if(trimmed.startsWith("%")) {
			
				// Do nothing.

			}
			// Image or video
			else if(trimmed.startsWith("|")) {

				// Remove the !
				var image = _.map(trimmed.split("|"), line => line.trim());
				
				elements.push(
					<Figure
						key={"element" + key++}
						url={image[1]}
						alt={image[2]}
						caption={image[3]}
						credit={image[4]}
					/>
				);
			}
			// Header
			else if(trimmed.startsWith("#")) {
				var count = 0;
				while(trimmed.startsWith("#")) {
					trimmed = trimmed.substring(1);
					count++;
				}
				trimmed = trimmed.trim();

				// Convert everything until the next line into a header.
				elements.push(
					count === 1 ? 
						<h2 key={"element" + key++}>{this.translateSegment(trimmed, 0)}</h2> :
					count === 2 ? 
						<h3 key={"element" + key++}>{this.translateSegment(trimmed, 0)}</h3> :
						<h4 key={"element" + key++}>{this.translateSegment(trimmed, 0)}</h4>
				);

			}
			// Bulleted list
			else if(trimmed.startsWith("* ")) {

				var bullets = [];

				// Process all the bullets until there aren't any.
				while(trimmed && trimmed.startsWith("* ")) {
					bullets.push(<li key={"bullet" + bullets.length}>{this.translateSegment(trimmed.substring(1).trim(), 0)}</li>);
					// Keep reading blank lines.
					do {
						trimmed = lines.shift();
						if(trimmed) trimmed = trimmed.trim();
						console.log("Next line is: " + trimmed);
					} while(trimmed === "");
				}

				// Make the list.
				elements.push(<ul key={"element" + key++}>{bullets}</ul>);

			}
			// Numbered list
			else if(trimmed.match("^[0-9]+.*")) {

				var items = [];

				// Process all the items until there aren't any.
				while(trimmed && trimmed.match("^[0-9]+.*")) {
					items.push(<li key={"item" + items.length}>{this.translateSegment(trimmed.substring(2).trim(), 0)}</li>);
					// Keep reading blank lines.
					do {
						trimmed = lines.shift();
						if(trimmed) trimmed = trimmed.trim();
					} while(trimmed === "");
				}

				// Make the list.
				elements.push(<ol key={"element" + key++}>{items}</ol>);

			}
			// Code
			else if(trimmed.startsWith("`")) {

				var code = trimmed.substring(1);

				do {
					line = lines.shift();
					if(line) {
						if(line.trim().endsWith("`"))
							line = line.substring(0, line.length - 1);
						if(line.length > 0)
							code = code + line + "\n";
					}
				} while(line && !line.startsWith("`"));

				// Add the code block.
				elements.push(<pre key={"element" + key++}>{code}</pre>);

			}
			// Make a paragraph with whatever came before this empty line.
			else if(trimmed === "") {

				// Add a paragraph with whatever was in the sequence before.
				if(sequence !== null) {
					elements.push(<p key={"element" + key++}>{sequence}</p>);
					sequence = null;
				}

			}
			// If it didn't match any of the blocks, make a paragraph.
			else {
				if(sequence === null)
					sequence = [];
				else {
					sequence.push(<br key={"break" + sequence.length} />)
				}
				sequence = sequence.concat(this.translateSegment(line, sequence.length));
			}

		}

		// Add a paragraph with whatever was in the sequence before.
		if(sequence !== null) {
			elements.push(<p key={"element" + key++}>{sequence}</p>);
		}
		
		return elements;

	}

	render() {

		var chapter = this.props.app.getContent(this.props.id);

		if(chapter)
			return (
				<div>
					<Header image={chapter.image} header={chapter.title} content={null} />
					{this.translate(chapter.text)}
				</div>
			);
		else
			return "Loading...";

	}

}

export { Chapter };