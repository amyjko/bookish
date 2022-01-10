import Book from "./Book";

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

type Position = "|" | "<" | ">";

type Bookkeeping = {
    citations: Record<string, boolean>;
    footnotes: Array<FootnoteNode>;
    headers: Array<HeaderNode>;
    symbols: Record<string, string>;
    embeds: Array<EmbedNode>;
    labels: Array<LabelNode>;
    errors: Array<ErrorNode>;
}

type NodeType = 
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
    "reference"

type BlockNode = HeaderNode | RuleNode | EmbedNode | BulletedListNode | NumberedListNode | CodeNode | QuoteNode | CalloutNode | TableNode | ParagraphNode;

export default class Parser {

    book: Book;
    text: string;
    index: number;
    openedDoubleQuote: boolean;
    // We pass this to all parsing functions to gather information strewn about the document.
    metadata: Bookkeeping;

    constructor(book: Book, text: string) {
        if(typeof text !== "string")
            throw "Parser expected a string but received " + typeof text;

        this.book = book;
        this.text = text;
        this.index = 0; // Start at the first character.
        this.openedDoubleQuote = false; // Track most recently observed quotes.
        this.metadata = {
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

    static parseChapter(book, text: string) {
        return (new Parser(book, Parser.preprocessSymbols(book, text))).parseChapter();
    }

    static parseContent(book, text: string) {
        return (new Parser(book, Parser.preprocessSymbols(book, text))).parseContent();
    }

    static parseEmbed(book, text: string) {
        return (new Parser(book, Parser.preprocessSymbols(book, text))).parseEmbed();
    }

    static parseReference(ref: string | Array<string>, book, short=false) {

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
                        return new ErrorNode("Unknown source " + source)
                    else
                        source = src
                }

                return new ReferenceNode(authors, year, title, source, url, summary, short)
            }
            else
                return new ErrorNode("Expected at least 4 items in the reference array, but found " + ref.length + ": " + ref.toString())
        }
        else
            return new ErrorNode("Invalid reference: " + ref)

    }

    // Get the next character, if there is one, null otherwise.
    peek(): string {
        return this.more() ? this.text.charAt(this.index) : null; 
    }
    
    // True if there are more characters to parse.
    more(): boolean { 
        return this.index < this.text.length; 
    }

    // Return the current character--if there is one-- and increment the index.
	read(smarten=true): string { 
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
    charBeforeNext(): string {
        return this.index === 0 ? null : this.text.charAt(this.index - 1);
    }

    // The character after
    charAfterNext(): string {
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
        return next === "\n" ||
            next === "_" ||
            next === "*" ||
            next === "`" ||
            next === "@" ||
            next === "~" ||
            (next === ":" && this.charAfterNext().match(/[a-z]/i) !== null) ||
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
        while(this.more() && /^[ \t]/.test(this.peek()))
            this.read();
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
    createError(message: string) {

        const error = new ErrorNode(message);
        this.metadata.errors.push(error);
        return error;

    }

    parseChapter(): ChapterNode {

        let blocks = [];

        // Read any symbols declared for this chapter.
        this.parseSymbols();

        // Get the remaining text.
        let declarations = this.text.substring(0, this.index);
        let rest = this.rest();
        
        // First, replace any occurrences of the symbol with the symbol's text.
        for(const [symbol, text] of Object.entries(this.metadata.symbols)) {
            rest = rest.replace(new RegExp("([^\\\\])@" + symbol + "\\b", "g"), "$1" + text);
        }

        // Replace all of the remaining symbols using book symbol definitions.
        rest = Parser.preprocessSymbols(this.book, rest);
        
        // Replace the text with the pre-processed text.
        this.text = declarations + rest;

        // While there's more text, parse a line.
        while(this.more()) {
            // Read a block
            const block = this.parseBlock();
            // Add it to the list if we parsed something.
            if(block !== null)
                blocks.push(block);            
            // Read whitespace until we find the next thing.
            while(this.peek() === " " || this.peek() === "\t" || this.peek() === "\n")
                this.read();
        }

        return new ChapterNode(blocks, this.metadata);

    }

    parseSymbols() {

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
                this.readUntilNewLine();
                this.createError(
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
                this.readUntilNewLine();
                this.createError("Symbol names are to be followed by a ':'");
                return;
            }

            // Read the colon
            this.read();

            // Read any whitespace after the colon.
            this.readWhitespace();

            // Remember where the text starts
            let startIndex = this.index;

            // Parse a block, any block.
            this.parseBlock();

            // Remember the text we parsed.
            this.metadata.symbols[name] = this.text.substring(startIndex, this.index).trim();

            // Read whitespace until we find the next non-whitespace thing.
            while(this.peek() === " " || this.peek() === "\t" || this.peek() === "\n")
                this.read();
        
        }

    }

    parseBlock(): BlockNode {

        // Read whitespace before the block.
        this.readWhitespace();

        // Read the comment and return nothing.
        if(this.nextIs("%")) {
            this.readUntilNewLine();
            return null;
        }
        // Parse and return a header if it starts with a hash
        else if(this.nextIs("#"))
            return this.parseHeader();
        // Parse and return a horizontal rule if it starts with a dash
        else if(this.nextIs("-"))
            return this.parseRule();
        // Parse and return an embed if it starts with a bar
        else if(this.nextIs("|"))
            return this.parseEmbed();
        // Parse and return a bulleted list if it starts with a star and space
        else if(this.nextMatches(/^\*+\s+/))
            return this.parseBulletedList();
        // Parse and return a numbered list if it starts with a number
        else if(this.nextMatches(/^[0-9]+\.+/))
            return this.parseNumberedList();
        // Parse and return a code block if it starts with `, some optional letters or a !, some whitespace, and a newline
        else if(this.nextMatches(/^`[a-zA-Z!]*[ \t]*\n/))
            return this.parseCode();
        // Parse and return a quote block if it starts with "
        else if(this.nextMatches(/^"[ \t]*\n/))
            return this.parseQuote();
        // Parse and return a callout if the line starts with =
        else if(this.nextMatches(/^=[ \t]*\n/))
            return this.parseCallout();
        // Parse and return a table if the line starts with a ,
        else if(this.nextIs(","))
            return this.parseTable();
        // Parse the text as paragraph;
        else
            return this.parseParagraph();

    }

    parseParagraph(): ParagraphNode {

        return new ParagraphNode(this.parseContent());

    }

    parseHeader(): HeaderNode {

        // Read a sequence of hashes
        let count = 0;
        while(this.nextIs("#")) {
            this.read();
            count++;
        }

        // Read any whitespace after the hashes.
        this.readWhitespace();

        // Parse some content.
        let content = this.parseContent();
        let node = new HeaderNode(Math.min(3, count), content);
        
        this.metadata.headers.push(node);

        // Return a header node.
        return node;

    }
    
    parseRule(): RuleNode {

        // Read until the end of the line. Ignore all text that follows.
        this.readUntilNewLine();

        return new RuleNode();

    }

    parseBulletedList(): BulletedListNode {

        const bullets = [];
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
                bullets.push(this.parseContent());
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
                    bullets.push(this.parseBulletedList());
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
        return new BulletedListNode(bullets);

    }

    parseNumberedList(): NumberedListNode {

        const bullets = [];
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
                bullets.push(this.parseContent());
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
                    bullets.push(this.parseNumberedList());
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
        return new NumberedListNode(bullets);

    }

    parseCode(): CodeNode {

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

        // Read the backtick.
        if(this.nextIs("`"))
            this.read();

        let position = this.parsePosition();

        // Read the caption. Note that parsing inline content stops at a newline, 
        // so if there's a line break after the last row, there won't be a caption.
        const caption = this.parseContent();

        return new CodeNode(code, language, caption, position);

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

    parseQuote(): QuoteNode {

        const blocks = [];

        // Parse the ", then any whitespace, then the newline
        this.read();

        // Then read any whitespace after the quote
        this.readWhitespace();

        // Then read the newline.
        this.read();

        while(this.more() && !this.nextIs("\"")) {
            // Read a block
            const block = this.parseBlock();
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
        let position = this.parsePosition()
        
        // Read any whitespace after the position indicator.
        this.readWhitespace();

        // Read the credit.
        const credit = this.nextIs("\n") ? null : this.parseContent();

        return new QuoteNode(blocks, credit, position);

    }

    parseCallout(): CalloutNode {

        const blocks = [];

        // Parse the = ...
        this.read();

        // ...then any whitespace
        this.readWhitespace();

        // ...then read the newline.
        this.read();

        // Then, read until we find a closing _
        while(this.more() && !this.nextIs("=")) {
            // Read a block
            const block = this.parseBlock();
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
        let position = this.parsePosition();
        
        // Read whitespace that follows.
        this.readWhitespace();

        return new CalloutNode(blocks, position);

    }

    parseTable(): TableNode {

        const rows = [];

        // Parse rows until the lines stop starting with ,
        while(this.more() && this.nextIs(",")) {

            let row = [];

            while(this.more() && !this.nextIs("\n")) {

                // Read the starting , or next |
                this.read();

                // Read content until reaching another | or the end of the line.
                row.push(this.parseContent("|"));

            }

            // Add the row.
            rows.push(row);

            // Read the newline
            this.read();

        }

        // Read the position indicator if there is one.        
        let position = this.parsePosition();

        // Read the caption. Note that parsing inline content stops at a newline, 
        // so if there's a line break after the last row, there won't be a caption.
        const caption = this.parseContent();

        return new TableNode(rows, caption, position);

    }

    // The "awaiting" argument keeps track of upstream formatting. We don't need a stack here
    // because we don't allow infinite nesting of the same formatting type.
    parseContent(awaiting?: string): ContentNode {

        let segments = [];

        // Read until hitting a delimiter.
        while(this.more() && !this.nextIs("\n")) {
            // Parse some formatted text
            if(this.nextIs("_") || this.nextIs("*"))
                segments.push(this.parseFormatted(this.peek()));
            // Parse unformatted text
            else if(this.nextIs("`")) {
                segments.push(this.parseInlineCode());
            }
            // Parse a citation list
            else if(this.nextIs("<"))
                segments.push(this.parseCitations());
            // Parse sub/super scripts
            else if(this.nextIs("^"))
                segments.push(this.parseSubSuperscripts());
            // Parse a footnote
            else if(this.nextIs("{"))
                segments.push(this.parseFootnote());
            // Parse a definition
            else if(this.nextIs("~"))
                segments.push(this.parseDefinition());
            // Parse an escaped character
            else if(this.nextIs("\\"))
                segments.push(this.parseEscaped());
            // Parse a link
            else if(this.nextIs("["))
               segments.push(this.parseLink());
            // Parse inline comments
            else if(this.charBeforeNext() === " " && this.nextIs("%"))
                this.parseComment();
            // Parse an unresolved symbol
            else if(this.nextIs("@")) {
                // Read the @, then the symbol name.
                this.read();
                let symbol = "";
                // Stop at the end of the name or file.
                while(this.more() && /[a-zA-Z0-9]/.test(this.peek()))
                    symbol = symbol + this.read();
                segments.push(this.createError("Couldn't find symbol @" + symbol));

            }
            // Parse a label
            else if(this.nextIs(":") && this.charAfterNext().match(/[a-z]/i)) {
                segments.push(this.parseLabel());
            }
            // Keep reading text until finding a delimiter.
            else {
                let text = "";
                while(this.more() && (!awaiting || !this.nextIs(awaiting)) && !this.nextIsContentDelimiter() && !this.nextIs("\n"))
                    text = text + this.read();
                segments.push(new TextNode(text, this.index));
            }

            // If we've reached a delimiter we're waiting for, then stop parsing, so it can handle it. Otherwise, we'll keep reading.
            if(this.peek() === awaiting)
                break;

        }

        return new ContentNode(segments);

    }

    parseEmbed(): EmbedNode | ErrorNode {

        // Read |
        this.read();

        // Read the URL
        const url = this.readUntilNewlineOr("|");

        // Error if missing URL.
        if(url === "") {
            this.readUntilNewLine();
            return this.createError("Missing URL in embed.");
        }

        if(this.peek() !== "|") {
            this.readUntilNewLine();
            return this.createError("Missing '|' after URL in embed");
        }

        // Read a |
        this.read();

        // Read the description
        const description = this.readUntilNewlineOr("|");

        if(this.peek() !== "|") {
            this.readUntilNewLine();
            return this.createError("Missing '|' after description in embed");
        }

        // Error if missing description.
        if(description === "") {
            this.readUntilNewLine();
            return this.createError("Missing image/video description in embed.");
        }
        
        // Read a |
        this.read();

        // Parse the caption
        const caption = this.parseContent("|");

        if(this.peek() !== "|") {
            this.readUntilNewLine();
            return this.createError("Missing '|' after caption in embed");
        }
        
        // Read a |
        this.read();

        // Parse the credit
        const credit = this.parseContent("|");

        // Error if missing credit.
        if(credit.toText().trim() === "") {
            this.readUntilNewLine();
            return this.createError("Missing credit in embed.");
        }
        
        // Check for the closing delimeter
        if(this.peek() !== "|") {
            this.readUntilNewLine();
            return this.createError("Missing '|' after credit in embed.");
        }

        // Read a |
        this.read();

        // Is there a position indicator?
        let position = this.parsePosition();
        
        const embed = new EmbedNode(url, description, caption, credit, position);

        this.metadata.embeds.push(embed);

        return embed;

    }

    parseComment(): void {

        // Consume the opening %
        this.read();

        // Consume everything until the next %.
        while(this.more() && this.peek() !== "\n" && this.peek() !== "%")
            this.read();

        // Consume the closing %, if we didn't reach the end of input or a newline.
        if(this.peek() === "%")
            this.read();

    }

    parseLabel(): LabelNode | ErrorNode {

        // Consume the :
        this.read();

        // Consume everything until it's not a letter.
        let id = "";
        while(this.more() && this.peek().match(/[a-z]/i))
            id = id + this.read();

        const label = new LabelNode(id);

        let matches = this.metadata.labels.filter(lab => lab.getID() === id);
        if(matches.length > 0)
            return this.createError("Duplicate label " + id);
        this.metadata.labels.push(label);

        return label;

    }

    parseFormatted(awaiting: string): FormattedNode {

        // Remember what we're matching.
        const delimeter = this.read();
        const segments = [];
        let text = "";

        // Read some content until reaching the delimiter or the end of the line
        while(this.more() && this.peek() !== delimeter && !this.nextIs("\n")) {
            // If this is more formatted text, make a text node with whatever we've accumulated so far, 
            // then parse the formatted text, then reset the accumulator.
            if(this.nextIsContentDelimiter()) {
                // If the text is a non-empty string, make a text node with what we've accumulated.
                if(text !== "")
                    segments.push(new TextNode(text, this.index));
                // Parse the formatted content.
                segments.push(this.parseContent(awaiting));
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
            segments.push(new TextNode(text, this.index));

        // Read the closing delimeter
        if(this.nextIs(delimeter))
            this.read();
        // If it wasn't closed, add an error
        else
            segments.push(this.createError("Unclosed " + delimeter));
        
        return new FormattedNode(delimeter, segments);

    }

    parseInlineCode(): InlineCodeNode {

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
        if(/^[a-z]$/.test(this.peek())) {
            do {
                language = language + this.read();
            } while(/^[a-z]$/.test(this.peek()));
        } else
            language = "plaintext"

        return new InlineCodeNode(code, language);
        
    }

    parseCitations(): CitationsNode {
        
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

        return new CitationsNode(citationList);

    }

    parseSubSuperscripts(): SubSuperscriptNode {
        
        // Read the ^
        this.read();

        // Default to superscript.
        let superscript = true;

        // Is there a 'v', indicating subscript?
        if(this.peek() === "v") {
            this.read();
            superscript = false;
        }

        // Parse the content
        let content = this.parseContent("^");

        // Read the closing ^
        this.read();

        return new SubSuperscriptNode(superscript, content);

    }

    parseFootnote(): FootnoteNode {
        
        // Read the {
        this.read();

        // Read the footnote content.
        const footnote = this.parseContent("}");

        // Read the closing }
        this.read();

        let node = new FootnoteNode(footnote);

        this.metadata.footnotes.push(node);

        return node;

    }

    parseDefinition(): DefinitionNode {
        
        // Read the ~
        this.read();

        // Read the footnote content.
        const text = this.parseContent("~");

        // Read the closing ~
        this.read();

        // Read the glossary entry ID
        let glossaryID = "";
        // Stop at the end of the name or file.
        while(this.more() && /[a-zA-Z]/.test(this.peek()))
            glossaryID = glossaryID + this.read();

        let node = new DefinitionNode(text, glossaryID);

        return node;

    }

    parseEscaped(): TextNode {

        // Skip the scape and just add the next character.
        this.read();
        return new TextNode(this.read(), this.index);

    }
    
    parseLink(): LinkNode | ErrorNode {
 
        // Read the [
        this.read();
        // Read some content, awaiting |
        const content = this.parseContent("|");

        // Catch links with no label.
        if(content.segments.length === 0)
            return this.createError("Unclosed link");

        // Catch missing bars
        if(this.peek() !== "|") {
            this.readUntilNewLine();
            return this.createError("Missing '|' in link");
        }

        // Read the |
        this.read();
        // Read the link
        let link = this.readUntilNewlineOr("]");

        // Catch missing closing
        if(this.peek() !== "]") {
            this.readUntilNewLine();
            return this.createError("Missing ] in link");
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

            if(chapter !== "" && !this.book.hasChapter(chapter))
                return this.createError("Unknown chapter name '" + link + "'");

        }

        return new LinkNode(content, link);

    }

}

class Node {
    toText() {
        throw new Error("Method not implemented.");
    }
    type: NodeType;

    constructor(type: NodeType) {

        if(typeof type !== "string" || type.length === 0)
            throw new Error("All nodes require a type string.")
        this.type = type
    }
}

export class ChapterNode extends Node {
    blocks: Array<Node>;
    metadata: Bookkeeping;
    constructor(blocks: Array<BlockNode>, metadata: Bookkeeping) {
        super("chapter");

        // The AST of the chapter.
        this.blocks = blocks;

        // Content extracted during parsing.
        this.metadata = metadata;

    }

    getErrors(): Array<ErrorNode> { return this.metadata.errors; }
    getCitations(): Record<string, boolean> { return this.metadata.citations; }
    getFootnotes(): Array<FootnoteNode> { return this.metadata.footnotes; }
    getHeaders(): Array<HeaderNode> { return this.metadata.headers; }
    getEmbeds(): Array<EmbedNode> { return this.metadata.embeds; }

    getCitationNumber(citationID: string) { 
        
        const index = Object.keys(this.getCitations()).sort().indexOf(citationID);

        if(index < 0)
            return null;
        else
            return index + 1;
    
    }

    toText(): string {
        return this.blocks.map(block => block.toText()).join(" ");
    }

}

class ParagraphNode extends Node {
    content: ContentNode;

    constructor(content: ContentNode) {
        super("paragraph");
        this.content = content;

    }

    toText() {
        return this.content.toText();
    }

}

export class EmbedNode extends Node {
    url: string;
    description: string;
    caption: ContentNode;
    credit: ContentNode;
    position: Position;

    constructor(url:string, description: string, caption: ContentNode, credit: ContentNode, position: Position) {
        super("embed");
        this.url = url;
        this.description = description;
        this.caption = caption;
        this.credit = credit;
        this.position = position;
    }

    toText() {
        return this.caption.toText();
    }

    toJSON() {
        return {
            url: this.url,
            alt: this.description,
            caption: this.caption.toText(),
            credit: this.credit.toText()
        };   
    }

}

class HeaderNode extends Node {
    level: number;
    content: ContentNode;
    constructor(level: number, content: ContentNode) {
        super("header");
        this.level = level;
        this.content = content;
    }

    toText() {
        return this.content.toText();
    }

}

class RuleNode extends Node {
    constructor() {
        super("rule");
    }

    toText() {
        return "";
    }

}

class BulletedListNode extends Node {
    items: Array<ContentNode | BulletedListNode>;
    constructor(items: Array<ContentNode | BulletedListNode>) {
        super("bulleted");
        this.items = items;
    }

    toText() {
        return this.items.map(item => item.toText()).join(" ");
    }

}

class NumberedListNode extends Node {
    items: Array<ContentNode | NumberedListNode>;
    constructor(items: Array<ContentNode | NumberedListNode>) {
        super("numbered");
        this.items = items;
    }

    toText() {
        return this.items.map(item => item.toText()).join(" ");
    }

}

class CodeNode extends Node {
    code: string;
    caption: ContentNode;
    position: Position;
    language: string;
    executable: boolean;
    constructor(code : string, language: string, caption: ContentNode, position: Position) {
        super("code");

        this.code = code;
        this.caption = caption;
        this.position = position;
        this.language = language ? language : "plaintext";
        this.executable = language.charAt(language.length - 1) === "!";

        if(this.executable)
            this.language = this.language.slice(0, -1);

    }

    toText() {
        return "";
    }

}

class QuoteNode extends Node {
    elements: Array<BlockNode>;
    credit: ContentNode;
    position: Position;

    constructor(elements: Array<BlockNode>, credit: ContentNode, position: Position) {
        super("quote");
        this.elements = elements;
        this.credit = credit;
        this.position = position;
    }

    toText() {
        return this.elements.map(element => element.toText()).join(" ") + (this.credit ? " " + this.credit.toText() : "");
    }

}

class CalloutNode extends Node {
    elements: Array<BlockNode>;
    position: Position;
    
    constructor(elements: Array<BlockNode>, position: Position) {
        super("callout");
        this.elements = elements;
        this.position = position;
    }

    toText() {
        return this.elements.map(element => element.toText()).join(" ");
    }

}

class TableNode extends Node {
    rows: Array<Array<ContentNode>>;
    caption: Node;
    position: Position;
    
    constructor(rows: Array<Array<ContentNode>>, caption: ContentNode, position: Position) {
        super("table");
        this.rows = rows;
        this.caption = caption;
        this.position = position;
    }

    toText() {
        return this.rows.map(row => row.map(cell => cell.toText()).join(", ")).join(", ");
    }

}

class FormattedNode extends Node {
    format: string;
    segments: Array<ContentNode | TextNode>;

    constructor(format: string, segments: Array<ContentNode | TextNode>) {
        super("formatted");
        this.format = format;
        this.segments = segments;
    }

    toText() {
        return this.segments.map(segment => segment.toText()).join(" ");
    }

}

class InlineCodeNode extends Node {
    code: string;
    language: string;

    constructor(code: string, language: string) {
        super("inline-code");
        this.code = code;
        this.language = language;
    }

    toText() {
        return this.code;
    }

}

class LinkNode extends Node {
    content: ContentNode;
    url: string;
    constructor(content: ContentNode, url: string) {
        super("link");
        this.content = content;
        this.url = url;
    }

    toText() {
        return this.content.toText();
    }

}

class CitationsNode extends Node {
    citations: Array<string>;
    constructor(citations: Array<string>) {
        super("citations");
        this.citations = citations;
    }

    toText() {
        return "";
    }

}

class DefinitionNode extends Node {
    phrase: ContentNode;
    glossaryID: string;
    constructor(phrase: ContentNode, glossaryID: string) {
        super("definition");
        this.phrase = phrase;
        this.glossaryID = glossaryID;
    }

    toText() {
        return this.phrase.toText();
    }

}

class FootnoteNode extends Node {
    footnote: ContentNode;
    constructor(footnote: ContentNode) {
        super("footnote");
        this.footnote = footnote;
    }

    toText() {
        return this.footnote.toText();
    }

}

class ContentNode extends Node {
    segments: Array<TextNode>;
    constructor(segments: Array<TextNode>) {
        super("content");
        this.segments = segments;
    }

    toText() {
        return this.segments.map(segment => segment.toText()).join(" ");
    }
}

class SubSuperscriptNode extends Node {
    superscript: boolean;
    content: ContentNode;
    constructor(superscript: boolean, content: ContentNode) {
        super("script");
        this.superscript = superscript;
        this.content = content;
    }

    toText() {
        return this.content.toText();
    }
}

class TextNode extends Node {
    text: string;
    position: number;
    constructor(text: string, position: number) {
        super("text");
        this.text = text;
        this.position = position - text.length;
    }

    toText() {
        return this.text;
    }

}

class ErrorNode extends Node {
    error: string;
    constructor(error: string) {
        super("error");
        this.error = error;
    }

    toText() {
        return "";
    }

}

class LabelNode extends Node {
    id: string;
    constructor(id: string) {
        super("label");
        this.id = id;
    }

    getID() { return this.id; }

    toText() { return ""; }

}

class ReferenceNode extends Node {
    authors: string;
    year: string;
    title: string;
    source: string;
    url: string;
    summary: string;
    short: boolean;
    constructor(authors: string, year: string, title: string, source: string, url: string, summary: string, short: boolean) {
        super("reference")
        this.authors = authors
        this.year = year
        this.title = title
        this.source = source
        this.url = url
        this.summary = summary
        this.short = short
    }
}