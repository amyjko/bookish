import _ from 'lodash';
import React from 'react';
import { Link } from 'react-router-dom';
import { NavHashLink } from "react-router-hash-link";
import { Figure } from './views/image';

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

class ChapterParser {

    constructor(text) {

        // A list of citations that occurred in this chapter,
        // so we can render them at the end.
        this.citations = [];

        // The list of elements that represent the chapter we're building.
        this.elements = [];

        // The key that React needs to distinguish elements.
        this.currentKey = 0;

        // Parse the text.
        this.parse(text);

    }

    getElements() { return this.elements; }
    getCitations() { return this.citations; }
    addCitation(citationID) { this.citations.push(citationID); }

    // Add an element to
    add(element) {

        // Add the element and increment the key, so react doesn't get confused about siblings.
        this.elements.push(element);
        this.currentKey++;

    }

    // Generate a key for the current element.
    key() { return "element" + this.currentKey }

    // Parse the markdown into React components.
    parse(text) {

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
                
                this.add(
                    <Figure
                        key={this.key()}
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
                this.add(
                    count === 1 ? 
                        <h2 key={this.key()}>{parseLine(trimmed, 0, this)}</h2> :
                    count === 2 ? 
                        <h3 key={this.key()}>{parseLine(trimmed, 0, this)}</h3> :
                        <h4 key={this.key()}>{parseLine(trimmed, 0, this)}</h4>
                );

            }
            // Bulleted list
            else if(trimmed.startsWith("* ")) {

                var bullets = [];

                // Process all the bullets until there aren't any.
                while(trimmed && trimmed.startsWith("* ")) {
                    bullets.push(<li key={"bullet" + bullets.length}>{parseLine(trimmed.substring(1).trim(), 0, this)}</li>);
                    // Keep reading blank lines.
                    do {
                        trimmed = lines.shift();
                        if(trimmed) trimmed = trimmed.trim();
                    } while(trimmed === "");
                }

                // Make the list.
                this.add(<ul key={this.key()}>{bullets}</ul>);

            }
            // Numbered list
            else if(trimmed.match("^[0-9]+.*")) {

                var items = [];

                // Process all the items until there aren't any.
                while(trimmed && trimmed.match("^[0-9]+.*")) {
                    items.push(<li key={"item" + items.length}>{parseLine(trimmed.substring(2).trim(), 0, this)}</li>);
                    // Keep reading blank lines.
                    do {
                        trimmed = lines.shift();
                        if(trimmed) trimmed = trimmed.trim();
                    } while(trimmed === "");
                }

                // Make the list.
                this.add(<ol key={this.key()}>{items}</ol>);

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
                this.add(<pre key={this.key()}>{code}</pre>);

            }
            // Make a paragraph with whatever came before this empty line.
            else if(trimmed === "") {

                // Add a paragraph with whatever was in the sequence before.
                if(sequence !== null) {
                    this.add(<p key={this.key()}>{sequence}</p>);
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
                sequence = sequence.concat(parseLine(line, sequence.length, this));
            }

        }

        // Add a paragraph with whatever was in the sequence before.
        if(sequence !== null) {
            this.add(<p key={this.key()}>{sequence}</p>);
        }

    }

}

function parseLine(line, key, chapter) {

    if(!(typeof line === "string" )) {
        return null;
    }

    var segments = [];
    var line = new Line(line);
    var fragment = "";

    if(key === undefined)
        key = 0;

    if(chapter === undefined)
        chapter = null;

    // Were we given a citation number? If not, start at 1.
    var citationNumber = chapter ? chapter.getCitations().length + 1 : 1;

    while(line.more()) {

        // Italic, bold, bold/italic
        if(line.peek() === "_" || line.peek() === "*" || line.peek() === "^") {

            // Capture the fragment prior.
            if(fragment.length > 0) {
                segments.push(<span key={"segment" + key++}>{fragment}</span>);
                fragment = "";
            }

            // Remember what we're matching.
            var delimeter = line.peek();

            // Make an em, strong, or combo.
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
        // Citations
        else if(line.peek() === "<") {

            // Capture the fragment prior.
            if(fragment.length > 0) {
                segments.push(<span key={"segment" + key++}>{fragment}</span>);
                fragment = "";
            }

            var citationIDs = "";
            line.next();
            while(line.more() && line.peek() !== ">")
                citationIDs = citationIDs + line.next();
            if(line.peek() === ">")
                line.next();

            // Trim any whitespace, then split by commas.
            citationIDs = citationIDs.trim().split(",");

            // Process each citation.
            _.each(
                citationIDs, 
                citationID => {
                    if(chapter)
                        chapter.addCitation(citationID);
                    segments.push(<NavHashLink smooth key={"segment" + key++} to={"#ref-" + citationID}>[{citationNumber++}]</NavHashLink>)
                }
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
                segments.push(<a key={"segment" + key++} href={link} target="_blank">{content}</a>)
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

export {ChapterParser, parseLine};