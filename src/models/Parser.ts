import Book from "./Book";
import { BulletedListNode } from "./BulletedListNode";
import { CalloutNode } from "./CalloutNode";
import { ChapterNode } from "./ChapterNode";
import { CitationsNode } from "./CitationsNode";
import { CodeNode } from "./CodeNode";
import { CommentNode } from "./CommentNode";
import { DefinitionNode } from "./DefinitionNode";
import { EmbedNode } from "./EmbedNode";
import { ErrorNode } from "./ErrorNode";
import { FootnoteNode } from "./FootnoteNode";
import { Format, FormattedNodeSegmentType, FormattedNode, FormattedNodeParent } from "./FormattedNode";
import { HeaderNode } from "./HeaderNode";
import { InlineCodeNode } from "./InlineCodeNode";
import { LabelNode } from "./LabelNode";
import { LinkNode } from "./LinkNode";
import { Node } from "./Node";
import { NumberedListNode } from "./NumberedListNode";
import { ParagraphNode } from "./ParagraphNode";
import { QuoteNode } from "./QuoteNode";
import { ReferenceNode } from "./ReferenceNode";
import { RuleNode } from "./RuleNode";
import { SubSuperscriptNode } from "./SubSuperscriptNode";
import { TableNode } from "./TableNode";
import { TextNode } from "./TextNode";

// TODO This grammar is slightly out of date.
// A simple recursive descent parser for this grammar.
// Embeds a tokenizer, since the lexical grammar is simple.
//
// CHAPTER :: SYMBOLS* (BLOCK\n)*
// SYMBOLS :: @name: BLOCK
// BLOCK :: (COMMENT | HEADER | RULE | EMBED | ORDERED | UNORDERED | CODE | QUOTE | PARAGRAPH)
// COMMENT :: %.+
// HEADER :: # CONTENT | ## CONTENT | ### CONTENT
// RULE :: ---
// EMBED :: |TEXT|TEXT|CONTENT|CONTENT|
// ORDERED :: (* CONTENT)+
// UNORDERED :: ([0-9]+. CONTENT)+
// CODE :: `\nTEXT`
// QUOTE :: "\nBLOCK*\n"CONTENT
// TABLE :: ((,CONTENT)+\n)+
// CODE :: `\nTEXT\n`
// PARAGRAPH :: CONTENT
// CONTENT :: FORMATTED | CITATIONS | ESCAPED | LINK | FOOTNOTE | SYMBOL | DEFINITION
// FORMATTED :: *CONTENT* | _CONTENT_ | `CONTENT`
// CITATIONS || <TEXT+,>
// ESCAPED :: \[char]
// LINK :: [CONTENT|TEXT]
// FOOTNOTE :: {TEXT}
// TEXT :: (.+)

export type Position = "|" | "<" | ">";

export type Bookkeeping = {
    index: Map<number, Node>;
    citations: Record<string, boolean>;
    footnotes: FootnoteNode[];
    headers: HeaderNode[];
    symbols: Record<string, string>;
    embeds: EmbedNode[];
    labels: LabelNode[];
    errors: ErrorNode[];
}

export type NodeType = 
    "chapter" | 
    "paragraph" | 
    "embed" | 
    "header" | 
    "rule" | 
    "bulleted" | 
    "numbered" | 
    "code" | 
    "quote" | 
    "callout" | 
    "table" | 
    "formatted" | 
    "inline-code" | 
    "link" | 
    "citations" | 
    "definition" | 
    "footnote" | 
    "content" | 
    "script" | 
    "text" | 
    "error" | 
    "label" | 
    "reference" |
    "comment"

export type BlockParentNode = ChapterNode | CalloutNode | QuoteNode;
export type BlockNode = HeaderNode | RuleNode | EmbedNode | BulletedListNode | NumberedListNode | CodeNode | QuoteNode | CalloutNode | TableNode | ParagraphNode | ErrorNode;

export default class Parser {

    book: Book | undefined;
    text: string;
    index: number;
    openedDoubleQuote: boolean;
    // We pass this to all parsing functions to gather information strewn about the document.
    metadata: Bookkeeping;

    constructor(book: Book | undefined, text: string) {
        if(typeof text !== "string")
            throw "Parser expected a string but received " + typeof text;

        this.book = book;
        this.text = text;
        this.index = 0; // Start at the first character.
        this.openedDoubleQuote = false; // Track most recently observed quotes.
        this.metadata = {
            index: new Map<number, Node>(),
            citations: {},
            footnotes: [],
            headers: [],
            symbols: {},
            embeds: [],
            labels: [],
            errors: []
        };

    }

    static preprocessSymbols(book: Book, text: string) {

        // Replace any remaining symbols with any definitions given.
        if(book && book.getSymbols()) {
            for(const [symbol, definition] of Object.entries(book.getSymbols())) {
                // Don't replace escaped at symbols. Otherwise, be liberal in replacing any matching symbol that starts with the symbol
                // name and ends with a word boundary.
                text = text.replace(new RegExp("([^\\\\])@" + symbol + "\\b", "g"), "$1" + definition);
            }
        }
        return text;

    }

    static parseChapter(book: Book | undefined, text: string) {
        return (new Parser(book, book ? Parser.preprocessSymbols(book, text) : text)).parseChapter();
    }

    static parseContent(book: Book, text: string) {
        return (new Parser(book, Parser.preprocessSymbols(book, text))).parseContent(undefined);
    }

    static parseEmbed(book: Book, text: string) {
        return (new Parser(book, Parser.preprocessSymbols(book, text))).parseEmbed(undefined);
    }

    static parseReference(ref: string | Array<string>, book: Book, short=false) {

        if(typeof ref === "string")
            return Parser.parseContent(book, ref);
        else if(Array.isArray(ref)) {
            // APA Format. Could eventually support multiple formats.
            if(ref.length >= 4) {
                let authors = ref[0];
                let year = ref[1];
                let title = ref[2];
                let source = ref[3];
                let url = ref.length === 5 ? ref[4] : null;
                let summary = ref.length === 6 ? ref[5] : null;

                if(source.charAt(0) === "#") {
                    let src = book.getSource(source)
                    if(src === null)
                        return new ErrorNode(undefined, undefined, "Unknown source " + source)
                    else
                        source = src
                }

                return new ReferenceNode(undefined, authors, year, title, source, url, summary, short)
            }
            else
                return new ErrorNode(undefined, undefined, "Expected at least 4 items in the reference array, but found " + ref.length + ": " + ref.toString())
        }
        else
            return new ErrorNode(undefined, undefined, "Invalid reference: " + ref)

    }

    // Get the next character, if there is one, null otherwise.
    peek(): string | null {
        return this.more() ? this.text.charAt(this.index) : null; 
    }
    
    // True if there are more characters to parse.
    more(): boolean { 
        return this.index < this.text.length; 
    }

    // Return the current character--if there is one-- and increment the index.
	read(smarten=true): string | null { 
		if(!this.more())
            return null;
        
        let char = this.text.charAt(this.index);

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

            if(char === '-' && this.text.charAt(this.index + 1) === '-' && this.text.charAt(this.index) !== '\n') {
                this.index++;
                char = "\u2014";
            }
        }

        // Advance to the next character in the document.
        this.index++;

        return char;
    }

    unread(): void {
        this.index--;
    }

    // All of the text including and after the current index.
    rest(): string {
        return this.text.substring(this.index);
    }

    // The character before
    charBeforeNext(): string | null {
        return this.index === 0 ? null : this.text.charAt(this.index - 1);
    }

    // The character after
    charAfterNext(): string | null {
        return this.index === this.text.length - 1 ? null : this.text.charAt(this.index + 1);
    }
    
    // All the text until the next newline
    restOfLine(): string {
        const nextNewline = this.text.substring(this.index).indexOf("\n") + this.index;
        if(nextNewline < 0)
            return this.text.substring(this.index);
        else  
            return this.text.substring(this.index, Math.max(this.index, nextNewline));
    }

    // True if the given string is occurs next in the text.
    nextIs(text: string) {
        if(!this.more())
            return false;
        return this.text.substring(this.index, this.index + text.length) === text;
    }

    // A critical list that tells inline formatting parsers to stop being greedy.
    nextIsContentDelimiter(): boolean {

        const next = this.peek();
        const charAfterNext = this.charAfterNext();
        return next === "\n" ||
            next === "_" ||
            next === "*" ||
            next === "`" ||
            next === "@" ||
            next === "~" ||
            (next === ":" && charAfterNext !== null && charAfterNext.match(/[a-z]/i) !== null) ||
            next === "^" ||
            next === "<" ||
            next === "{" ||
            (this.charBeforeNext() === " " && next === "%") ||
            next === "[" ||
            next === "\\";

    }

    // True if the next part of this string matches the given regular expression.
    nextMatches(regex: RegExp): boolean {
        if(!this.more())
            return false;
        return regex.test(this.rest());
    }

    // Returns true if all of the text between the current character and the next newline is whitespace.
    isBlankLine(): boolean {
        return this.restOfLine().trim() === "";
    }

    // Read until encountering something other than a tab or a space.
    readWhitespace(): void {
        let peek = this.peek()
        while(peek !== null && /^[ \t]/.test(peek)) {
            this.read();
            peek = this.peek()
        }
    }

    // Read until the end of the line.
    readUntilNewLine(): string {
        let text = "";
        while(this.more() && this.peek() !== "\n")
            text = text + this.read();
        return text;
    }

    // Read until encountering the given string and return the read text.
    readUntilNewlineOr(string: string): string {
        let text = "";
        while(this.more() && !this.nextIs("\n") && !this.nextIs(string))
            text = text + this.read();
        return text;
    }

    // Create and store an error
    createError(parent: Node | undefined, text: string | undefined, message: string) {

        const error = new ErrorNode(parent, text, message);
        this.metadata.errors.push(error);
        return error;

    }

    parseChapter(): ChapterNode {

        let blocks: BlockNode[] = [];

        // Make the chapter node so we can pass it around.
        const chapter = new ChapterNode(blocks, this.metadata)

        // Read any symbols declared for this chapter.
        this.parseSymbols(chapter);

        // Get the remaining text.
        let declarations = this.text.substring(0, this.index);
        let rest = this.rest();
        
        // First, replace any occurrences of the symbol with the symbol's text.
        for(const [symbol, text] of Object.entries(this.metadata.symbols)) {
            rest = rest.replace(new RegExp("([^\\\\])@" + symbol + "\\b", "g"), "$1" + text);
        }

        // Replace all of the remaining symbols using book symbol definitions.
        if(this.book)
            rest = Parser.preprocessSymbols(this.book, rest);
        
        // Replace the text with the pre-processed text.
        this.text = declarations + rest;

        // While there's more text, parse a line.
        while(this.more()) {
            // Read a block
            const block = this.parseBlock(chapter);
            // Add it to the list if we parsed something.
            if(block !== null)
                blocks.push(block);            
            // Read whitespace until we find the next thing.
            while(this.peek() === " " || this.peek() === "\t" || this.peek() === "\n")
                this.read();
        }

        return chapter;

    }

    parseSymbols(parent: ChapterNode) {

        // Read whitespace before the symbols
        this.readWhitespace();

        // Keep reading symbols
        while(this.nextIs("@")) {

            // Read the @
            this.read();

            // Read the name.
            let name = this.readUntilNewlineOr(":");

            // Names need to be letter and numbers only.
            if(!/^[a-zA-Z0-9]+$/.test(name)) {
                this.createError(
                    parent,
                    this.readUntilNewLine(),
                    name.trim() === "" ? 
                        "Did you mean to declare a symbol? Use an @ symbol, then a name of only numbers and letters, then a colon, then whatever content you want it to represent." :
                        "'" + name + "' isn't a valid name for a symbol; letters and numbers only"
                    );
                return;
            }

            // Read any whitespace until the colon.
            this.readWhitespace();

            // Name declarations need to be terminated with a colon before the block starts.
            if(!this.nextIs(":")) {
                this.createError(parent, this.readUntilNewLine(), "Symbol names are to be followed by a ':'");
                return;
            }

            // Read the colon
            this.read();

            // Read any whitespace after the colon.
            this.readWhitespace();

            // Remember where the text starts
            let startIndex = this.index;

            // Parse a block, any block.
            this.parseBlock(parent);

            // Remember the text we parsed.
            this.metadata.symbols[name] = this.text.substring(startIndex, this.index).trim();

            // Read whitespace until we find the next non-whitespace thing.
            while(this.peek() === " " || this.peek() === "\t" || this.peek() === "\n")
                this.read();
        
        }

    }

    parseBlock(parent: ChapterNode | CalloutNode | QuoteNode): BlockNode {

        // Read whitespace before the block.
        this.readWhitespace();

        // Read comment lines
        while(this.nextIs("%")) {
            this.readUntilNewLine();
        }

        // Parse and return a header if it starts with a hash
        if(this.nextIs("#"))
            return this.parseHeader(parent);
        // Parse and return a horizontal rule if it starts with a dash
        else if(this.nextIs("-"))
            return this.parseRule(parent);
        // Parse and return an embed if it starts with a bar
        else if(this.nextIs("|"))
            return this.parseEmbed(parent);
        // Parse and return a bulleted list if it starts with a star and space
        else if(this.nextMatches(/^\*+\s+/))
            return this.parseBulletedList(parent);
        // Parse and return a numbered list if it starts with a number
        else if(this.nextMatches(/^[0-9]+\.+/))
            return this.parseNumberedList(parent);
        // Parse and return a code block if it starts with `, some optional letters or a !, some whitespace, and a newline
        else if(this.nextMatches(/^`[a-zA-Z!]*[ \t]*\n/))
            return this.parseCode(parent);
        // Parse and return a quote block if it starts with "
        else if(this.nextMatches(/^"[ \t]*\n/))
            return this.parseQuote(parent);
        // Parse and return a callout if the line starts with =
        else if(this.nextMatches(/^=[ \t]*\n/))
            return this.parseCallout(parent);
        // Parse and return a table if the line starts with a ,
        else if(this.nextIs(","))
            return this.parseTable(parent);
        // Parse the text as paragraph;
        else
            return this.parseParagraph(parent);

    }

    parseParagraph(parent: ChapterNode | CalloutNode | QuoteNode): ParagraphNode {

        const paragraph = new ParagraphNode(parent)
        paragraph.setContent(this.parseContent(paragraph))
        return paragraph;

    }

    parseHeader(parent: ChapterNode | CalloutNode | QuoteNode): HeaderNode {

        // Read a sequence of hashes
        let count = 0;
        while(this.nextIs("#")) {
            this.read();
            count++;
        }

        // Read any whitespace after the hashes.
        this.readWhitespace();

        // Parse some content.
        let header = new HeaderNode(parent, Math.min(3, count));
        header.setContent(this.parseContent(header));
        
        this.metadata.headers.push(header);

        // Return a header node.
        return header;

    }
    
    parseRule(parent: ChapterNode | CalloutNode | QuoteNode): RuleNode {

        // Read until the end of the line. Ignore all text that follows.
        this.readUntilNewLine();

        return new RuleNode(parent);

    }

    parseBulletedList(parent: ChapterNode | CalloutNode | BulletedListNode | QuoteNode): BulletedListNode {

        const items: (FormattedNode | BulletedListNode)[] = [];
        const bullets = new BulletedListNode(parent, items)
        let lastLevel = undefined;
        let currentLevel = undefined;

        // Keep parsing bullets until there aren't any.
        while(this.nextMatches(/^\*+\s+/)) {

            // Remember the last level
            lastLevel = currentLevel;

            // Figure out this level.
            currentLevel = 0;
            while(this.nextIs("*")) {
                this.read();
                currentLevel++;
            }

            // If this is the first bullet, or its the same level, just parse content.
            if(lastLevel === undefined || lastLevel === currentLevel) {
                // Read the whitespace after the bullet.
                this.readWhitespace();
                // Parse content after the bullet.
                items.push(this.parseContent(bullets));
            }
            // Otherwise, unread the stars, then either stop parsing or parse nested list.
            else {

                // Unread the stars.
                let count = currentLevel;
                while(count > 0) {
                    this.unread();
                    count--;
                }

                // If this new bullet is a lower level, then stop reading bullets.
                if(currentLevel < lastLevel)
                    break;
                // Otherwise, it's greater, and we should read another list.
                else {
                    items.push(this.parseBulletedList(bullets));
                    // Reset the current level to the last level, so we expect another bullet at the same level.
                    currentLevel = lastLevel;
                }
            }

            // Read trailing whitespace after the content.
            this.readWhitespace();

            /// Keep reading newlines and content until we get to something that's neither.
            while(this.peek() === "\n") {
                // Read the newline
                this.read();
                // Read whitespace before the next block.
                this.readWhitespace();
            }

        }
        return bullets;

    }

    parseNumberedList(parent: ChapterNode | CalloutNode | NumberedListNode | QuoteNode): NumberedListNode {

        const items: (FormattedNode | NumberedListNode)[] = [];
        const list = new NumberedListNode(parent, items);
        let lastLevel = undefined;
        let currentLevel = undefined;

        // Keep parsing bullets until there aren't any.
        while(this.nextMatches(/^[0-9]+\.+/)) {

            // Read the digits and remember how many there were so we can backtrack.
            let digits = this.index;
            this.readUntilNewlineOr(".");
            digits = this.index - digits;

            // Remember the last level
            lastLevel = currentLevel;

            // Figure out this level.
            currentLevel = 0;
            while(this.nextIs(".")) {
                this.read();
                currentLevel++;
            }

            // If this is the first bullet, or its the same level, just parse another bullet.
            if(lastLevel === undefined || lastLevel === currentLevel) {
                // Read the whitespace after the bullet.
                this.readWhitespace();
                // Parse content after the bullet.
                items.push(this.parseContent(list));
            }
            // Otherwise, unread the stars, then either stop parsing or parse nested list.
            else {

                // Unread the periods.
                let count = currentLevel;
                while(count > 0) {
                    this.unread();
                    count--;
                }
                                
                // Unread the digits
                while(digits > 0) {
                    this.unread();
                    digits--;
                }

                // If this new bullet is a lower level, then stop reading bullets.
                if(currentLevel < lastLevel)
                    break;
                // Otherwise, it's greater, and we should read another list.
                else {
                    items.push(this.parseNumberedList(list));
                    // Reset the current level to the last level, so we expect another bullet at the same level.
                    currentLevel = lastLevel;
                }

            }

            // Read trailing whitespace and newlines.            
            this.readWhitespace();
            while(this.peek() === "\n") {
                // Read the newline
                this.read();
                // Read whitespace before the next block.
                this.readWhitespace();
            }

        }
        return list;

    }

    parseCode(parent: ChapterNode | CalloutNode | QuoteNode): CodeNode {

        // Parse the back tick
        this.read();

        // Parse through the next new line
        let language = this.readUntilNewLine();

        // Read the newline
        this.read();

        // Read until we encounter a closing back tick.
        let code = "";
        while(this.more() && !this.nextIs("`")) {
            let next = this.read(false);
            if(next === "\\") {
                if(this.nextIs("`")) {
                    this.read();
                    next = "`";
                }
            }
            code = code + next;
        }

        // Trim the code.
        code = code.trim();

        // Read the backtick.
        if(this.nextIs("`"))
            this.read();

        let position = this.parsePosition();

        const node = new CodeNode(parent, code, language, position)

        // Read the caption. Note that parsing inline content stops at a newline, 
        // so if there's a line break after the last row, there won't be a caption.
        node.setCaption(this.parseContent(node))

        return node;

    }

    parsePosition(): Position {

        let position: Position = "|";
        // Is there a position indicator?
        if(this.nextIs("<")) {
            position = "<";
            this.read();
        }
        else if(this.nextIs(">")) {
            position = ">";
            this.read();
        }            

        return position;

    }

    parseQuote(parent: ChapterNode | CalloutNode | QuoteNode): QuoteNode {

        const blocks: BlockNode[] = [];
        const quote = new QuoteNode(parent, blocks)

        // Parse the ", then any whitespace, then the newline
        this.read();

        // Then read any whitespace after the quote
        this.readWhitespace();

        // Then read the newline.
        this.read();

        while(this.more() && !this.nextIs("\"")) {
            // Read a block
            const block = this.parseBlock(quote);
            // Add it to the list if we parsed something.
            if(block !== null)
                blocks.push(block);
            // Read whitespace until we find the next thing.
            while(this.peek() === " " || this.peek() === "\t" || this.peek() === "\n")
                this.read();
        }

        // Read the closing " and the whitespace that follows.
        this.read();

        // Is there a position indicator?
        quote.setPosition(this.parsePosition())
        
        // Read any whitespace after the position indicator.
        this.readWhitespace();

        // Read the credit.
        quote.setCredit(this.nextIs("\n") ? undefined : this.parseContent(quote))

        return quote;

    }

    parseCallout(parent: ChapterNode | CalloutNode | QuoteNode): CalloutNode {

        const blocks: BlockNode[] = [];
        const callout = new CalloutNode(parent, blocks)

        // Parse the = ...
        this.read();

        // ...then any whitespace
        this.readWhitespace();

        // ...then read the newline.
        this.read();

        // Then, read until we find a closing _
        while(this.more() && !this.nextIs("=")) {
            // Read a block
            const block = this.parseBlock(callout);
            // Add it to the list if we parsed something.
            if(block !== null)
                blocks.push(block);
            // Read whitespace until we find the next thing.
            while(this.peek() === " " || this.peek() === "\t" || this.peek() === "\n")
                this.read();
        }

        // Read the closing =
        this.read();

        // Is there a position indicator?
        callout.setPosition(this.parsePosition());
        
        // Read whitespace that follows.
        this.readWhitespace();

        return callout;

    }

    parseTable(parent: ChapterNode | CalloutNode | QuoteNode): TableNode {

        const rows: FormattedNode[][] = [];
        const table = new TableNode(parent, rows)
        // Parse rows until the lines stop starting with ,
        while(this.more() && this.nextIs(",")) {

            let row = [];

            while(this.more() && !this.nextIs("\n")) {

                // Read the starting , or next |
                this.read();

                // Read whitespace that follows.
                this.readWhitespace();

                // Read content until reaching another | or the end of the line.
                row.push(this.parseContent(table, "|"));

            }

            // Add the row.
            rows.push(row);

            // Read the newline
            this.read();

        }

        // Read the position indicator if there is one.        
        table.setPosition(this.parsePosition());

        // Read the caption. Note that parsing inline content stops at a newline, 
        // so if there's a line break after the last row, there won't be a caption.
        table.setCaption(this.parseContent(table));

        return table;

    }

    // The "awaiting" argument keeps track of upstream formatting. We don't need a stack here
    // because we don't allow infinite nesting of the same formatting type.
    parseContent(parent: FormattedNodeParent | undefined, awaiting?: string): FormattedNode {

        const segments: FormattedNodeSegmentType[] = [];
        const content = new FormattedNode(parent, "", segments);

        // Read until hitting a delimiter.
        while(this.more() && !this.nextIs("\n")) {

            const next = this.peek();
            const charAfterNext = this.charAfterNext();

            // Parse some formatted text
            if(next === "_" || next === "*")
                segments.push(this.parseFormatted(content, next));
            // Parse unformatted text
            else if(this.nextIs("`")) {
                segments.push(this.parseInlineCode(content));
            }
            // Parse a citation list
            else if(this.nextIs("<"))
                segments.push(this.parseCitations(content));
            // Parse sub/super scripts
            else if(this.nextIs("^"))
                segments.push(this.parseSubSuperscripts(content));
            // Parse a footnote
            else if(this.nextIs("{"))
                segments.push(this.parseFootnote(content));
            // Parse a definition
            else if(this.nextIs("~"))
                segments.push(this.parseDefinition(content));
            // Parse an escaped character
            else if(this.nextIs("\\"))
                segments.push(this.parseEscaped(content));
            // Parse a link
            else if(this.nextIs("["))
               segments.push(this.parseLink(content));
            // Parse inline comments
            else if(this.charBeforeNext() === " " && this.nextIs("%"))
                segments.push(this.parseComment(content));
            // Parse an unresolved symbol
            else if(next === "@") {
                // Read the @, then the symbol name.
                this.read();
                let symbol = "";
                // Stop at the end of the name or file.
                let next = this.peek();
                while(next !== null && /[a-zA-Z0-9]/.test(next)) {
                    symbol = symbol + this.read();
                    next = this.peek();
                }
                segments.push(this.createError(content, undefined, "Couldn't find symbol @" + symbol));

            }
            // Parse a label
            else if(next === ":" && charAfterNext !== null && charAfterNext.match(/[a-z]/i)) {
                segments.push(this.parseLabel(content));
            }
            // Keep reading text until finding a delimiter.
            else {
                let text = "";
                while(this.more() && (!awaiting || !this.nextIs(awaiting)) && !this.nextIsContentDelimiter() && !this.nextIs("\n"))
                    text = text + this.read();
                segments.push(new TextNode(content, text, this.index));
            }

            // If we've reached a delimiter we're waiting for, then stop parsing, so it can handle it. Otherwise, we'll keep reading.
            if(this.peek() === awaiting)
                break;

        }

        return content;

    }

    parseEmbed(parent: BlockParentNode | undefined): EmbedNode | ErrorNode {

        // Read |
        this.read();

        // Read the URL
        const url = this.readUntilNewlineOr("|");

        // Error if missing URL.
        if(url === "")
            return this.createError(parent, this.readUntilNewLine(), "Missing URL in embed.");

        if(this.peek() !== "|")
            return this.createError(parent, this.readUntilNewLine(), "Missing '|' after URL in embed");

        // Read a |
        this.read();

        // Read the description
        const description = this.readUntilNewlineOr("|");

        if(this.peek() !== "|")
            return this.createError(parent, this.readUntilNewLine(), "Missing '|' after description in embed");

        // Error if missing description.
        if(description === "")
            return this.createError(parent, this.readUntilNewLine(), "Missing image/video description in embed.");
        
        const embed = new EmbedNode(parent, url, description);

        // Read a |
        this.read();

        // Parse the caption
        embed.setCaption(this.parseContent(embed, "|"));

        if(this.peek() !== "|")
            return this.createError(embed, this.readUntilNewLine(), "Missing '|' after caption in embed");
        
        // Read a |
        this.read();

        // Parse the credit
        embed.setCredit(this.parseContent(embed, "|"));

        // Error if missing credit.
        if(embed.getCredit().toText().trim() === "")
            return this.createError(parent, this.readUntilNewLine(), "Missing credit in embed.");
        
        // Check for the closing delimeter
        if(this.peek() !== "|")
            return this.createError(parent, this.readUntilNewLine(), "Missing '|' after credit in embed.");

        // Read a |
        this.read();

        // Is there a position indicator?
        embed.setPosition(this.parsePosition());
        
        this.metadata.embeds.push(embed);

        return embed;

    }

    parseComment(parent: FormattedNode): CommentNode {

        // Consume the opening %
        this.read();

        // Consume everything until the next %.
        let comment = ""
        while(this.more() && this.peek() !== "\n" && this.peek() !== "%")
            comment = comment + this.read();

        // Consume the closing %, if we didn't reach the end of input or a newline.
        if(this.peek() === "%")
            this.read();

        return new CommentNode(parent, comment);

    }

    parseLabel(parent: FormattedNode): LabelNode | ErrorNode {

        // Consume the :
        this.read();

        // Consume everything until it's not a letter.
        let id = "";
        let next = this.peek();
        while(next !== null && next.match(/[a-z]/i)) {
            id = id + this.read();
            next = this.peek();
        }

        const label = new LabelNode(parent, id);

        let matches = this.metadata.labels.filter(lab => lab.getID() === id);
        if(matches.length > 0)
            return this.createError(parent, undefined, "Duplicate label " + id);
        this.metadata.labels.push(label);

        return label;

    }

    parseFormatted(parent: FormattedNode, awaiting: string): FormattedNode | ErrorNode {

        // Remember what we're matching.
        const delimeter = this.read();
        const segments: Array<FormattedNode | TextNode | ErrorNode> = [];
        let text = "";

        if(delimeter === null)
            return this.createError(parent, undefined, "Somehow parsing formatted text at end of file.");

        const node = new FormattedNode(parent, delimeter as Format, segments)

        // Read some content until reaching the delimiter or the end of the line
        while(this.more() && this.peek() !== delimeter && !this.nextIs("\n")) {
            // If this is more formatted text, make a text node with whatever we've accumulated so far, 
            // then parse the formatted text, then reset the accumulator.
            if(this.nextIsContentDelimiter()) {
                // If the text is a non-empty string, make a text node with what we've accumulated.
                if(text !== "")
                    segments.push(new TextNode(node, text, this.index));
                // Parse the formatted content.
                segments.push(this.parseContent(node, awaiting));
                // Reset the accumulator.
                text = "";
            }
            // Add the next character to the accumulator.
            else {
                text = text + this.read();
            }
        }

        // If there's more text, save it!
        if(text !== "")
            segments.push(new TextNode(node, text, this.index));

        // Read the closing delimeter
        if(this.nextIs(delimeter))
            this.read();
        // If it wasn't closed, add an error
        else
            segments.push(this.createError(node, undefined, "Unclosed " + delimeter));
        
        return node;

    }

    parseInlineCode(parent: FormattedNode): InlineCodeNode {

        // Parse the back tick
        this.read();

        // Read until we encounter a closing back tick.
        let code = "";
        while(this.more() && !this.nextIs("`")) {
            let next = this.read(false);
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

        // If there's a letter immediately after a backtick, it's a language for an inline code name
        let language = "";
        let next = this.peek();
        if(next !== null && /^[a-z]$/.test(next)) {
            do {
                language = language + this.read();
                next = this.peek();
            } while(next !== null && /^[a-z]$/.test(next));
        } else
            language = "plaintext"

        return new InlineCodeNode(parent, code, language);
        
    }

    parseCitations(parent: FormattedNode): CitationsNode {
        
        let citations = "";

        // Read the <
        this.read();
        // Read the citations.
        citations = this.readUntilNewlineOr(">");
        if(this.peek() === ">")
            this.read();

        // Trim any whitespace, then split by commas.
        const citationList = citations.trim().split(",").map(citation => citation.trim());

        // Record each citation for later.
        citationList.forEach(citation => {
            this.metadata.citations[citation] = true;
        });

        return new CitationsNode(parent, citationList);

    }

    parseSubSuperscripts(parent: FormattedNode): SubSuperscriptNode {
        
        // Read the ^
        this.read();

        // Default to superscript.
        let superscript = true;

        // Is there a 'v', indicating subscript?
        if(this.peek() === "v") {
            this.read();
            superscript = false;
        }

        const node = new SubSuperscriptNode(parent, superscript)

        // Parse the content
        node.setContent(this.parseContent(node, "^"));

        // Read the closing ^
        this.read();

        return node;

    }

    parseFootnote(parent: FormattedNode): FootnoteNode {

        let node = new FootnoteNode(parent);

        // Read the {
        this.read();

        // Read the footnote content.
        const footnote = this.parseContent(node, "}");
        node.setFootnote(footnote)

        // Read the closing }
        this.read();

        this.metadata.footnotes.push(node);

        return node;

    }

    parseDefinition(parent: FormattedNode): DefinitionNode {

        const node = new DefinitionNode(parent);

        // Read the ~
        this.read();
        
        // Read the definition content.
        node.setPhrase(this.parseContent(node, "~"));

        // Read the closing ~
        this.read();

        // Read the glossary entry ID
        let glossaryID = "";
        // Stop at the end of the name or file.
        let next = this.peek();
        while(next !== null && /[a-zA-Z]/.test(next)) {
            glossaryID = glossaryID + this.read();
            next = this.peek();
        }

        node.setGlossaryID(glossaryID)

        return node;

    }

    parseEscaped(chapter: FormattedNode): TextNode | ErrorNode {

        // Skip the scape and just add the next character.
        this.read();
        const char = this.read();
        if(char)
            return new TextNode(chapter, char, this.index);

        return this.createError(chapter, undefined, "Unterminated escape.");

    }
    
    parseLink(parent: FormattedNode): LinkNode | ErrorNode {
 
        const node = new LinkNode(parent)

        // Read the [
        this.read();
        // Read some content, awaiting |
        const content = this.parseContent(node, "|");

        // Catch links with no label.
        if(content.isEmpty())
            return this.createError(parent, undefined, "Unclosed link");

        // Catch missing bars
        if(this.peek() !== "|") {
            this.readUntilNewLine();
            return this.createError(parent, undefined, "Missing '|' in link");
        }

        // Read the |
        this.read();
        // Read the link
        let link = this.readUntilNewlineOr("]");

        // Catch missing closing
        if(this.peek() !== "]") {
            this.readUntilNewLine();
            return this.createError(parent, undefined, "Missing ] in link");
        }

        // Read the ]
        this.read();

        // If it's internal, validate it.
        if(!link.startsWith("http")) {

            // Pull out any labels and just get the chapter name.
            let chapter = link;
            let label = null;
            if(link.indexOf(":") >= 0) {
                let parts = chapter.split(":");
                chapter = parts[0];
                label = parts[1];
            }

            if(chapter !== "" && this.book && !this.book.hasChapter(chapter))
                return this.createError(parent, undefined, "Unknown chapter name '" + link + "'");

        }

        node.setContent(content)
        node.setURL(link)

        return node;

    }

}