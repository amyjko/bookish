import _ from 'lodash';
import React from 'react';
import { Link } from 'react-router-dom';
import { NavHashLink } from "react-router-hash-link";
import { Figure } from './views/image';
import Highlight from 'react-highlight.js';


// A simple recursive descent parser for this grammar.
// Embeds a tokenizer, since the lexical grammar is simple.
//
// CHAPTER :: (BLOCK\n)*
// BLOCK :: (COMMENT | HEADER | RULE | EMBED | ORDERED | UNORDERED | CODE | QUOTE | PARAGRAPH)
// COMMENT :: %.+
// HEADER :: # CONTENT | ## CONTENT | ### CONTENT
// RULE :: ---
// EMBED :: |TEXT|TEXT|CONTENT|CONTENT|
// ORDERED :: (* CONTENT)+
// UNORDERED :: ([0-9]+. CONTENT)+
// CODE :: `\nTEXT`
// QUOTE :: "\nBLOCK*\n"CONTENT
// PARAGRAPH :: CONTENT
// CONTENT :: FORMATTED | CITATIONS | ESCAPED | LINK
// FORMATTED :: *CONTENT* | _CONTENT_ | `CONTENT`
// CITATIONS || <TEXT+,>
// ESCAPED :: \[char]
// LINK :: [CONTENT|TEXT]
// TEXT :: (.+)
class Parser {

    constructor(text) {
        if(typeof text !== "string")
            throw "Parser expected a string but received " + typeof text;

        this.text = text;

        // Start at the first character.
        this.index = 0;

        // Track most recently observed quotes.
        this.openedDoubleQuote = false;

    }

    static parseChapter(text) {
        return (new Parser(text)).parseChapter();
    }

    static parseContent(text) {
        return (new Parser(text)).parseContent();
    }

    static parseReference(ref) {

        return (
            typeof ref === "string" ? 
                Parser.parseContent(ref).toDOM() :
            Array.isArray(ref) ?
                // APA Format. Could eventually suppport multiple formats.
                <span>{ref[0]} ({ref[1]}). <a href={ref[4]} target={"_blank"}>{ref[2]}</a>. <em>{ref[3]}</em>.</span> :
                <span>Invalid reference: <code>{"" + ref}</code></span>
        );

    }

    // Get the next character, if there is one, null otherwise.
    peek() { 
        return this.more() ? this.text.charAt(this.index) : null; 
    }
    
    // True if there are more characters to parse.
    more() { 
        return this.index < this.text.length; 
    }

    // Return the current character--if there is one-- and increment the index.
	read(smarten=true) { 
		if(!this.more())
            return null;
        
        var char = this.text.charAt(this.index);

        if(smarten) {
            if(char === "\n")
                this.openedDoubleQuote = false;

            // As we read, replace straight quotes with smart quotes.
            if(char === '"') {
                // Replace left quotes after whitespace.
                if(this.openedDoubleQuote) {
                    char = "\u201d";
                }
                else {
                    char = "\u201c";
                }
                this.openedDoubleQuote = !this.openedDoubleQuote;
            } else if(char === "'") {
                // If there's whitespace before this, it's a left single quote.
                if(/\s/.test(this.text.charAt(this.index - 1)))
                    char = "\u2018";
                // Otherwise, it's a right single quote.
                else {
                    char = "\u2019";
                }
            }
        }

        // Advance to the next character in the document.
        this.index++;

        return char;
    }

    // All of the text including and after the current index.
    rest() {
        return this.text.substring(this.index);
    }

    // All the text until the next newline
    restOfLine() {
        var nextNewline = this.text.substring(this.index).indexOf("\n") + this.index;
        if(nextNewline < 0)
            return this.text.substring(this.index);
        else  
            return this.text.substring(this.index, Math.max(this.index, nextNewline));
    }

    // True if the given string is occurs next in the text.
    nextIs(string) {
        if(!this.more())
            return false;
        return this.text.substring(this.index, this.index + string.length) === string;
    }

    nextIsContentDelimiter() {

        var next = this.peek();
        return next === "\n" ||
            next === "_" ||
            next === "*" ||
            next === "`" ||
            next === "<" ||
            next === "[" ||
            next === "\\";

    }

    // True if the next part of this string matches the given regular expression.
    nextMatches(regex) {
        if(!this.more())
            return false;
        return regex.test(this.rest());
    }

    // Returns true if all of the text between the current character and the next newline is whitespace.
    isBlankLine() {
        return this.restOfLine().trim() === "";
    }

    // Read until encountering non-whitespace.
    readWhitespace() {
        while(this.more() && /^[ \t]/.test(this.peek()))
            this.read();
    }

    // Read until the end of the line.
readUntilNewLine() {
        var text = "";
        while(this.more() && this.peek() !== "\n")
            text = text + this.read();
        return text;
    }

    // Read until encountering the given string and return the read text.
    readUntilNewlineOr(string) {
        var text = "";
        while(this.more() && !this.nextIs("\n") && !this.nextIs(string))
            text = text + this.read();
        return text;
    }

    parseChapter() {

        var blocks = [];

        // We pass this to all parsing functions to gather information strewn about the document.
        var metadata = {
            citations: {}
        }

        // While there's more text, parse a line.
        while(this.more()) {
            // Read a block
            var block = this.parseBlock(metadata);
            // Add it to the list if we parsed something.
            if(block !== null)
                blocks.push(block);            
            // Read whitespace until we find the next thing.
            while(this.peek() === " " || this.peek() === "\t" || this.peek() === "\n")
                this.read();
        }

        return new ChapterNode(blocks, metadata);

    }

    parseBlock(metadata) {

        // Read whitespace before the block.
        this.readWhitespace();

        // Read the comment and return nothing.
        if(this.nextIs("%")) {
            this.readUntilNewLine();
            return null;
        }
        // Parse and return a header
        else if(this.nextIs("#"))
            return this.parseHeader(metadata);
        // Parse and return a horizontal rule
        else if(this.nextIs("-"))
            return this.parseRule(metadata);
        // Parse and return an embed.
        else if(this.nextIs("|"))
            return this.parseEmbed(metadata);
        // Parse and return a bulleted list
        else if(this.nextIs("* "))
            return this.parseBulletedList(metadata);
        // Parse and return a numbered list
        else if(this.nextMatches(/^[0-9]+\./))
            return this.parseNumberedList(metadata);
        // Parse and return a code block
        else if(this.nextIs("`"))
            return this.parseCode(metadata);
        // Parse and return a quote block
        else if(this.nextMatches(/^"[ \t]*\n/))
            return this.parseQuote(metadata);
        // Parse the text as paragraph;
        else
            return this.parseParagraph(metadata);

    }

    parseParagraph(metadata) {

        return new ParagraphNode(this.parseContent(metadata));

    }

    parseHeader(metadata) {

        // Read a sequence of hashes
        var count = 0;
        while(this.nextIs("#")) {
            this.read();
            count++;
        }

        // Read any whitespace after the hashes.
        this.readWhitespace();

        // Parse some content and then return a header.
        return new HeaderNode(count, this.parseContent(metadata));

    }
    
    parseRule(metadata) {

        // Read until the end of the line. Ignore all text that follows.
        this.readUntilNewLine();

        return new RuleNode();

    }

    parseBulletedList(metadata) {

        var bullets = [];

        // Process all the bullets until there aren't any.
        while(this.nextIs("* ")) {
            // Read the bullet and then any trailing whitespace before content.
            this.read();
            this.readWhitespace();
            // Parse content.
            bullets.push(this.parseContent(metadata));
            // Read trailing whitespace and newlines.            
            this.readWhitespace();
            while(this.peek() === "\n") {
                // Read the newline
                this.read();
                // Read whitespace before the next block.
                this.readWhitespace();
            }
        }
        return new BulletedListNode(bullets);

    }

    parseNumberedList(metadata) {

        var bullets = [];

        // Process all the bullets until there aren't any.
        while(this.nextMatches(/^[0-9]+\./)) {
            // Read until the period.
            this.readUntilNewlineOr(".");
            // Read the period, then whitespace.
            this.read();
            this.readWhitespace();
            // Parse some content.
            bullets.push(this.parseContent(metadata));
            // Read trailing whitespace and newlines.            
            this.readWhitespace();
            while(this.peek() === "\n") {
                // Read the newline
                this.read();
                // Read whitespace before the next block.
                this.readWhitespace();
            }
        }
        return new NumberedListNode(bullets);

    }

    parseCode(metadata) {

        // Parse the back tick
        this.read();

        // Parse through the next new line
        var language = this.readUntilNewLine();

        // Read the newline
        this.read();

        // Read until we encounter a closing back tick.
        var code = "";
        while(this.more() && !this.nextIs("`")) {
            var next = this.read(false);
            if(next === "\\") {
                if(this.nextIs("`")) {
                    this.read();
                    next = "`";
                }
            }
            code = code + next;
        }

        // Read the backtick.
        if(this.nextIs("`"))
            this.read();

        return new CodeNode(code, language);

    }

    parseQuote(metadata) {

        var blocks = [];

        // Parse the ", then any whitespace, then the newline
        this.read();

        // Then read any whitespace after the quote
        this.readWhitespace();

        // Then read the newline.
        this.read();

        while(this.more() && !this.nextIs("\"")) {
            // Read a block
            var block = this.parseBlock(metadata);
            // Add it to the list if we parsed something.
            if(block !== null)
            blocks.push(block);            
            // Read whitespace until we find the next thing.
            while(this.peek() === " " || this.peek() === "\t" || this.peek() === "\n")
                this.read();
        }

        // Read the closing " and the whitespace that follows.
        this.read();
        this.readWhitespace();

        // Read the credit.
        var credit = this.nextIs("\n") ? null : this.parseContent(metadata);

        return new QuoteNode(blocks, credit);

    }

    // The "awaiting" argument keeps track of upstream formatting. We don't need a stack here
    // because we don't allow infinite nesting of the same formatting type.
    parseContent(metadata, awaiting) {

        var segments = [];

        // Read until hitting a delimiter.
        while(this.more() && !this.nextIs("\n")) {
            // Parse some formatted text
            if(this.nextIs("_") || this.nextIs("*") || this.nextIs("`"))
                segments.push(this.parseFormatted(metadata, this.peek()));
            // Parse a citation list
            else if(this.nextIs("<"))
                segments.push(this.parseCitations(metadata));
            // Parse an escaped character
            else if(this.nextIs("\\"))
                segments.push(this.parseEscaped(metadata));
            // Parse a link
            else if(this.nextIs("["))
               segments.push(this.parseLink(metadata));
            // Keep reading text until finding a delimiter.
            else {

                var text = "";
                while(this.more() && (!awaiting || !this.nextIs(awaiting)) && !this.nextIsContentDelimiter() && !this.nextIs("\n"))
                    text = text + this.read();
                segments.push(new TextNode(text));
            }

            // If we've reached a delimiter we're waiting for, then stop parsing, so it can handle it. Otherwise, we'll keep reading.
            if(this.peek() === awaiting)
                break;

        }

        return new ContentNode(segments);

    }

    parseEmbed(metadata) {

        // Read |
        this.read();
        // Read the URL
        var url = this.readUntilNewlineOr("|");

        if(this.peek() !== "|") {
            this.readUntilNewLine();
            return new ErrorNode("Missing '|' in embed");
        }

        // Read a |
        this.read();

        // Read the description
        var description = this.readUntilNewlineOr("|");

        if(this.peek() !== "|") {
            this.readUntilNewLine();
            return new ErrorNode("Missing '|' in link");
        }

        // Read a |
        this.read();
        // Parse the caption
        var caption = this.parseContent(metadata, "|");

        if(this.peek() !== "|") {
            this.readUntilNewLine();
            return new ErrorNode("Missing '|' in link");
        }

        // Read a |
        this.read();

        // Parse the credit
        var credit = this.parseContent(metadata, "|");

        if(this.peek() !== "|") {
            this.readUntilNewLine();
            return new ErrorNode("Missing '|' in link");
        }

        // Parse the closing bar
        this.read();

        return new EmbedNode(url, description, caption, credit);

    }

    parseFormatted(metadata, awaiting) {

        // Remember what we're matching.
        var delimeter = this.read();
        var segments = [];
        var text = "";

        // Read some content until reaching the delimiter or the end of the line
        while(this.more() && this.peek() !== delimeter && !this.nextIs("\n")) {
            // If this is more formatted text, make a text node with whatever we've accumulated so far, 
            // then parse the formatted text, then reset the accumulator.
            if(this.peek() === "_" || this.peek() === "*" || this.peek() == "`" || this.peek() === "<" || this.peek() === "\\" || this.peek() === "[") {
                // If the text is a non-empty string, make a text node with what we've accumulated.
                if(text !== "")
                    segments.push(new TextNode(text));
                // Parse the formatted content.
                segments.push(this.parseContent(metadata, awaiting));
                // Reset the accumulator.
                text = "";
            }
            // Add the next character to the accumulator.
            else {
                text = text + this.read();
            }
        }

        if(text !== "")
            segments.push(new TextNode(text));

        // Read the closing delimter
        if(this.nextIs(delimeter))
            this.read();
        // If it wasn't closed, add an error
        else
            segments.push(new ErrorNode("Unclosed " + delimeter));

        return new FormattedNode(delimeter, segments);

    }

    parseCitations(metadata) {
        
        var citations = "";

        // Read the <
        this.read();
        // Read the citations.
        var citations = this.readUntilNewlineOr(">");
        if(this.peek() === ">")
            this.read();

        // Trim any whitespace, then split by commas.
        citations = _.map(citations.trim().split(","), citation => citation.trim());

        // We won't necessarily be gathering this data.
        // This does mean that if someone cites something in a non-chapter
        // it will silently fail.
        if(metadata)
            // Record each citation for later.
            _.each(citations, citation => {
                metadata.citations[citation] = true;
            });

        return new CitationsNode(citations);

    }

    parseEscaped(metadata) {

        // Skip the scape and just add the next character.
        this.read();
        return new TextNode(this.read());

    }
    
    parseLink(metadata) {
 
        // Read the [
        this.read();
        // Read some content, awaiting |
        var content = this.parseContent(metadata, "|");

        // Catch links with no label.
        if(content.segments.length === 0)
            return new ErrorNode("Unclosed link");

        // Catch missing bars
        if(this.peek() !== "|") {
            this.readUntilNewLine();
            return new ErrorNode("Missing '|' in link");
        }

        // Read the |
        this.read();
        // Read the link
        var link = this.readUntilNewlineOr("]");

        // Catch missing closing
        if(this.peek() !== "]") {
            this.readUntilNewLine();
            return new ErrorNode("Missing ] in link");
        }

        // Read the ]
        this.read();

        return new LinkNode(content, link);

    }

}

class Node {
    constructor() {}
}

class ChapterNode extends Node {
    constructor(blocks, metadata) {
        super();
        this.blocks = blocks;

        // A set of citations that occurred in this chapter.
        // Citation nodes will add.
        this.metadata = metadata;

    }

    getCitations() { 
        return this.metadata.citations; 
    }

    getCitationNumber(citationID) { 
        
        var index = Object.keys(this.getCitations()).sort().indexOf(citationID);

        if(index < 0)
            return null;
        else
            return index + 1;
    
    }

    toDOM(app, query) {
        return <div key="chapter">
            {_.map(this.blocks, (block, index) => block.toDOM(app, this, query, "block-" + index))}
        </div>;
    }

    toText() {
        return _.join(_.map(this.blocks, block => block.toText()), " ");
    }

}

class ParagraphNode extends Node {

    constructor(content) {
        super();
        this.content = content;
    }
    toDOM(app, chapter, query, key) {
        return <p key={key}>{this.content.toDOM(app, chapter, query)}</p>;
    }

    toText() {
        return this.content.toText();
    }

}

class EmbedNode extends Node {
    constructor(url, description, caption, credit) {
        super();
        this.url = url;
        this.description = description;
        this.caption = caption;
        this.credit = credit;
    }

    toDOM(app, chapter, query, key) {
        return <Figure key={key}
            url={this.url}
            alt={this.description}
            caption={this.caption.toDOM(app, chapter, query)}
            credit={this.credit.toDOM(app, chapter, query)}
        />
    }

    toText() {
        return this.caption.toText();
    }

}

class HeaderNode extends Node {
    constructor(level, content) {
        super();
        this.level = level;
        this.content = content;
    }

    toDOM(app, chapter, query, key) {
        return this.level === 1 ?
            <h2 key={key}>{this.content.toDOM(app, chapter, query)}</h2> :
            this.level === 2 ?
            <h3 key={key}>{this.content.toDOM(app, chapter, query)}</h3> :
            <h4 key={key}>{this.content.toDOM(app, chapter, query)}</h4>
    }

    toText() {
        return this.content.toText();
    }

}

class RuleNode extends Node {
    constructor() {
        super();
    }

    toDOM(app, chapter, query, key) { return <hr key={key} />; }

    toText() {
        return "";
    }

}

class BulletedListNode extends Node {
    constructor(items) {
        super();
        this.items = items;
    }

    toDOM(app, chapter, query, key) {
        return <ul key={key}>{_.map(this.items, (item, index) => <li key={"item-" + index}>{item.toDOM(app, chapter, query)}</li>)}</ul>
    }

    toText() {
        return _.join(_.map(this.items, item => item.toText()), " ");
    }

}

class NumberedListNode extends Node {
    constructor(items) {
        super();
        this.items = items;
    }

    toDOM(app, chapter, query, key) {
        return <ol key={key}>{_.map(this.items, (item, index) => <li key={"item-" + index}>{item.toDOM(app, chapter, query)}</li>)}</ol>;
    }

    toText() {
        return _.join(_.map(this.items, item => item.toText()), " ");
    }

}

class CodeNode extends Node {
    constructor(code, language) {
        super();
        this.code = code;
        this.language = language ? language : "plaintext";
    }
    toDOM(app, chapter, query, key) {
        return <Highlight key={key} language={this.language}>{this.code}</Highlight>;
    }

    toText() {
        return "";
    }

}

class QuoteNode extends Node {

    constructor(elements, credit) {
        super();
        this.elements = elements;
        this.credit = credit;
    }

    toDOM(app, chapter, query, key) {

        return <blockquote className="blockquote" key={key}>
            {_.map(this.elements, (element, index) => element.toDOM(app, chapter, query, "quote-" + index))}
            {this.credit ? <footer className="blockquote-footer"><cite>{this.credit.toDOM(app, chapter, query)}</cite></footer> : null }
        </blockquote>

    }

    toText() {
        return _.join(_.map(this.elements, element => element.toText()), " ") + (this.credit ? " " + this.credit.toText() : "");
    }

}

class FormattedNode extends Node {

    constructor(format, segments) {
        super();
        this.format = format;
        this.segments = segments;
    }

    toDOM(app, chapter, query, key) {
        
        var segmentDOMs = _.map(this.segments, (segment, index) => segment.toDOM(app, chapter, query, "formatted-" + index));

        if(this.format === "*")
            return <strong key={key}>{segmentDOMs}</strong>;
        else if(this.format === "_")
            return <em key={key}>{segmentDOMs}</em>;
        else if(this.format === "`")
            return <code key={key}>{segmentDOMs}</code>;
        else
            return <span key={key}>{segmentDOMs}</span>;
        
    }

    toText() {
        return _.join(_.map(this.segments, segment => segment.toText()), " ");
    }

}

class LinkNode extends Node {
    constructor(content, url) {
        super();
        this.content = content;
        this.url = url;
    }
    toDOM(app, chapter, query, key) {
        return this.url.startsWith("http") ?
            // If this is external, make an anchor that opens a new window.
            <a  key={key} href={this.url} target="_blank">{this.content.toDOM(app, chapter, query)}</a> :
            // If this is internal, make a route link.
            <Link key={key} to={this.url}>{this.content.toDOM(app, chapter, query)}</Link>;
    }

    toText() {
        return this.content.toText();
    }

}

class CitationsNode extends Node {
    constructor(citations) {
        super();
        this.citations = citations;
    }
    toDOM(app, chapter, query, key) {

        var segments = [];

        if(!chapter)
            return null;

        // Convert each citation ID until a link.
        _.each(
            this.citations,
            (citationID, index) => {
                // Find the citation number. There should always be one,
                var citationNumber = chapter.getCitationNumber(citationID)
                if(citationNumber !== null && citationID in app.getReferences()) 
                    // Add a citation.
                    segments.push(
                        <NavHashLink 
                            smooth 
                            key={"citation-" + index}
                            to={"#ref-" + citationID}>
                            <sup>{citationNumber}</sup>
                        </NavHashLink>
                    )
                // If it's not a valid citation number, add an error.
                else {
                    segments.push(<span className="alert alert-danger" key={"citation-error-" + index}>Unknown reference: <code>{citationID}</code></span>)
                }

                // If there's more than one citation and this isn't the last, add a comma.
                if(this.citations.length > 1 && index < this.citations.length - 1)
                    segments.push(<sup key={"citation-comma-" + index}>,</sup>);
            }
        );

        return <span key={key}>{segments}</span>;

    }

    toText() {
        return "";
    }

}

class ContentNode extends Node {
    constructor(segments) {
        super();
        this.segments = segments;
    }

    toDOM(app, chapter, query, key) {
        return <span key={key}>{_.map(this.segments, (segment, index) => segment.toDOM(app, chapter, query, "content-" + index))}</span>;
    }

    toText() {
        return _.join(_.map(this.segments, segment => segment.toText()), " ");
    }

}

class TextNode extends Node {
    constructor(text) {
        super();
        this.text = text;
    }

    toDOM(app, chapter, query, key) {
        
        if(query) {
            var text = this.text;
            var lowerText = text.toLowerCase();
            if(lowerText.indexOf(query) >= 0) {

                // Find all the matches
                var indices = [];
                for(var i = 0; i < text.length; ++i) {
                    if (lowerText.substring(i, i + query.length) === query) {
                        indices.push(i);
                    }
                }

                // Go through each one and construct contents for the span to return.
                var segments = [];
                for(var i = 0; i < indices.length; i++) {
                    // Push the text from the end of the last match or the start of the string.
                    segments.push(text.substring(i === 0 ? 0 : indices[i - 1] + query.length, indices[i]));
                    segments.push(<span key={"match-" + i} className="query-match">{text.substring(indices[i], indices[i] + query.length)}</span>);
                }
                if(indices[indices.length - 1] < text.length - 1)
                    segments.push(text.substring(indices[indices.length - 1] + query.length, text.length));

                return <span key={key}>{segments}</span>;
                // var left = this.text.substring(0, index);
                // var match = this.text.substring(index, index + query.length);
                // var right = this.text.substring(index + query.length);

                // return <span key={key}>{left}<span className="query-match">{match}</span><span>{right}</span></span>

            }
            else return this.text;
        } else return this.text;

    }

    toText() {
        return this.text;
    }

}

class ErrorNode extends Node {
    constructor(error) {
        super();
        this.error = error;
    }

    toDOM(app, chapter, key) {
        return <span key={key} className="alert alert-danger">Error: {this.error}</span>;
    }

    toText() {
        return "";
    }

}

export {Parser};