import type Edition from '../book/Edition';
import CalloutNode from './CalloutNode';
import ChapterNode from './ChapterNode';
import CitationsNode from './CitationsNode';
import CodeNode from './CodeNode';
import CommentNode from './CommentNode';
import DefinitionNode from './DefinitionNode';
import EmbedNode from './EmbedNode';
import ErrorNode from './ErrorNode';
import FootnoteNode from './FootnoteNode';
import FormatNode from './FormatNode';
import type { Format, FormatNodeSegmentType } from './FormatNode';
import InlineCodeNode from './InlineCodeNode';
import LabelNode from './LabelNode';
import LinkNode from './LinkNode';
import ListNode from './ListNode';
import ParagraphNode from './ParagraphNode';
import QuoteNode from './QuoteNode';
import RuleNode from './RuleNode';
import TableNode from './TableNode';
import TextNode from './TextNode';
import type Position from './Position';
import type BlockNode from './BlockNode';
import type Bookkeeping from './Bookkeeping';
import LineBreakNode from './LineBreakNode';
import { LINE_BREAK } from './Symbols';

const numberedRE = /^[0-9]+\.+/;
const bulletRE = /^\*+\s+/;

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

export default class Parser {
    book: Edition | undefined;
    text: string;
    index: number;
    openedDoubleQuote: boolean;
    // We pass this to all parsing functions to gather information strewn about the document.
    metadata: Bookkeeping;

    constructor(book: Edition | undefined, text: string) {
        if (typeof text !== 'string')
            throw 'Parser expected a string but received ' + typeof text;

        this.book = book;
        this.text = text;
        this.index = 0; // Start at the first character.
        this.openedDoubleQuote = false; // Track most recently observed quotes.
        this.metadata = {
            symbols: {},
        };
    }

    static preprocessSymbols(book: Edition, text: string) {
        // Replace any remaining symbols with any definitions given.
        if (book && book.getSymbols()) {
            for (const [symbol, definition] of Object.entries(
                book.getSymbols()
            )) {
                // Don't replace escaped at symbols. Otherwise, be liberal in replacing any matching symbol that starts with the symbol
                // name and ends with a word boundary.
                text = text.replace(
                    new RegExp('([^\\\\])@' + symbol + '\\b', 'g'),
                    '$1' + definition
                );
            }
        }
        return text;
    }

    static parseChapter(book: Edition | undefined, text: string) {
        return new Parser(
            book,
            book === undefined ? text : Parser.preprocessSymbols(book, text)
        ).parseChapter();
    }

    static parseFormat(book: Edition | undefined, text: string) {
        return new Parser(
            book,
            book === undefined ? text : Parser.preprocessSymbols(book, text)
        ).parseFormat();
    }

    static parseEmbed(book: Edition | undefined, text: string) {
        return new Parser(
            book,
            book === undefined ? text : Parser.preprocessSymbols(book, text)
        ).parseEmbed();
    }

    // Get the next character, if there is one, null otherwise.
    peek(): string | null {
        return this.more() ? this.text.charAt(this.index) : null;
    }

    // True if there are more characters to parse.
    more(): boolean {
        return this.index < this.text.length;
    }

    nextIsEmptyParagraph() {
        return (
            this.text.charAt(this.index) === '\n' &&
            this.text.charAt(this.index + 1) === '\n' &&
            this.text.charAt(this.index + 2) === '\n'
        );
    }

    nextIsWhitespace() {
        return (
            (this.peek() === ' ' ||
                this.peek() === '\t' ||
                this.peek() === '\n') &&
            !this.nextIsEmptyParagraph()
        );
    }

    // Return the current character--if there is one-- and increment the index.
    read(smarten = true): string | null {
        if (!this.more()) return null;

        let char = this.text.charAt(this.index);

        if (smarten) {
            if (char === '\n') this.openedDoubleQuote = false;

            // As we read, replace straight quotes with smart quotes.
            if (char === '"') {
                // Replace left quotes after whitespace.
                if (this.openedDoubleQuote) {
                    char = '\u201d';
                } else {
                    char = '\u201c';
                }
                this.openedDoubleQuote = !this.openedDoubleQuote;
            } else if (char === "'") {
                // If there's whitespace before this, it's a left single quote.
                if (/\s/.test(this.text.charAt(this.index - 1)))
                    char = '\u2018';
                // Otherwise, it's a right single quote.
                else {
                    char = '\u2019';
                }
            }

            if (
                char === '-' &&
                this.text.charAt(this.index + 1) === '-' &&
                this.text.charAt(this.index) !== '\n'
            ) {
                this.index++;
                char = '\u2014';
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
        return this.index === this.text.length - 1
            ? null
            : this.text.charAt(this.index + 1);
    }

    // All the text until the next newline
    restOfLine(): string {
        const nextNewline =
            this.text.substring(this.index).indexOf('\n') + this.index;
        if (nextNewline < 0) return this.text.substring(this.index);
        else
            return this.text.substring(
                this.index,
                Math.max(this.index, nextNewline)
            );
    }

    // True if the given string is occurs next in the text.
    nextIs(text: string) {
        if (!this.more()) return false;
        return (
            this.text.substring(this.index, this.index + text.length) === text
        );
    }

    // A critical list that tells inline formatting parsers to stop being greedy.
    nextIsContentDelimiter(): boolean {
        const next = this.peek();
        const charAfterNext = this.charAfterNext();
        return (
            next === '\n' ||
            next === '_' ||
            next === '*' ||
            next === '`' ||
            next === '@' ||
            next === LINE_BREAK ||
            next === '~' ||
            (next === ':' &&
                charAfterNext !== null &&
                charAfterNext.match(/[a-z]/i) !== null) ||
            next === '^' ||
            next === '<' ||
            next === '{' ||
            (this.charBeforeNext() === ' ' && next === '%') ||
            next === '[' ||
            next === '\\'
        );
    }

    // True if the next part of this string matches the given regular expression.
    nextMatches(regex: RegExp): boolean {
        if (!this.more()) return false;
        return regex.test(this.rest());
    }

    // Returns true if all of the text between the current character and the next newline is whitespace.
    isBlankLine(): boolean {
        return this.restOfLine().trim() === '';
    }

    // Read until encountering something other than a tab or a space.
    readWhitespace(): void {
        let peek = this.peek();
        while (peek !== null && /^[ \t]/.test(peek)) {
            this.read();
            peek = this.peek();
        }
    }

    // Read until the end of the line.
    readUntilNewLine(): string {
        let text = '';
        while (this.more() && this.peek() !== '\n') text = text + this.read();
        return text;
    }

    // Read until encountering the given string and return the read text.
    readUntilNewlineOr(string: string): string {
        let text = '';
        while (this.more() && !this.nextIs('\n') && !this.nextIs(string))
            text = text + this.read();
        return text;
    }

    parseChapter(): ChapterNode {
        let blocks: BlockNode[] = [];

        // Read any symbols declared for this chapter.
        this.parseSymbols();

        // Get the remaining text.
        let declarations = this.text.substring(0, this.index);
        let rest = this.rest();

        // First, replace any occurrences of the symbol with the symbol's text.
        for (const [symbol, text] of Object.entries(this.metadata.symbols)) {
            rest = rest.replace(
                new RegExp('([^\\\\])@' + symbol + '\\b', 'g'),
                '$1' + text
            );
        }

        // Replace all of the remaining symbols using book symbol definitions.
        if (this.book) rest = Parser.preprocessSymbols(this.book, rest);

        // Replace the text with the pre-processed text.
        this.text = declarations + rest;

        // While there's more text, parse a line.
        let trailingNewlines = 0;
        while (this.more()) {
            trailingNewlines = 0;
            // Read a block and add it to the list if we parsed something.
            blocks.push(this.parseBlock());
            // Read whitespace until we find the next thing.
            while (this.nextIsWhitespace()) {
                if (this.peek() === '\n') trailingNewlines++;
                this.read();
            }
        }

        // If there are no blocks, or the chapter ended with two newlines, append an empty paragraph with an empty format node and an empty text node.
        if (blocks.length === 0 || trailingNewlines > 1)
            blocks.push(new ParagraphNode());

        // Make the chapter node so we can pass it around.
        return new ChapterNode(blocks, this.metadata);
    }

    parseSymbols() {
        // Read whitespace before the symbols
        this.readWhitespace();

        // Keep reading symbols
        while (this.nextIs('@')) {
            // Read the @
            this.read();

            // Read the name.
            let name = this.readUntilNewlineOr(':');

            // Names need to be letter and numbers only.
            if (!/^[a-zA-Z0-9]+$/.test(name)) {
                new ErrorNode(
                    this.readUntilNewLine(),
                    name.trim() === ''
                        ? 'Did you mean to declare a symbol? Use an @ symbol, then a name of only numbers and letters, then a colon, then whatever content you want it to represent.'
                        : "'" +
                          name +
                          "' isn't a valid name for a symbol; letters and numbers only"
                );
                return;
            }

            // Read any whitespace until the colon.
            this.readWhitespace();

            // Name declarations need to be terminated with a colon before the block starts.
            if (!this.nextIs(':')) {
                new ErrorNode(
                    this.readUntilNewLine(),
                    "Symbol names are to be followed by a ':'"
                );
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
            this.metadata.symbols[name] = this.text
                .substring(startIndex, this.index)
                .trim();

            // Read whitespace until we find the next non-whitespace thing.
            while (this.nextIsWhitespace()) this.read();
        }
    }

    parseBlock(): BlockNode {
        // Read comment lines
        while (this.nextIs('%')) {
            this.readUntilNewLine();
        }

        // Parse and return a header if it starts with a hash
        if (this.nextIs('#')) return this.parseHeader();
        // Parse and return a horizontal rule if it starts with a dash
        else if (this.nextIs('-')) return this.parseRule();
        // Parse and return an embed if it starts with a bar
        else if (this.nextIs('|')) return this.parseEmbed();
        // Parse and return a bulleted or numbered list
        else if (this.nextMatches(bulletRE) || this.nextMatches(numberedRE))
            return this.parseList();
        // Parse and return a code block if it starts with `, some optional letters or a !, some whitespace, and a newline
        else if (this.nextMatches(/^`[a-zA-Z!]*[ \t]*\n/))
            return this.parseCode();
        // Parse and return a quote block if it starts with "
        else if (this.nextMatches(/^"[ \t]*\n/)) return this.parseQuote();
        // Parse and return a callout if the line starts with =
        else if (this.nextMatches(/^=[ \t]*\n/)) return this.parseCallout();
        // Parse and return a table if the line starts with a ,
        else if (this.nextIs(',')) return this.parseTable();
        // Parse the text as paragraph;
        else return this.parseParagraph();
    }

    parseParagraph(): ParagraphNode {
        if (this.nextIsEmptyParagraph()) {
            this.read();
            this.read();
            return new ParagraphNode(0, new FormatNode('', [new TextNode()]));
        } else return new ParagraphNode(0, this.parseFormat());
    }

    parseHeader(): ParagraphNode {
        // Read a sequence of hashes
        let count = 0;
        while (this.nextIs('#')) {
            this.read();
            count++;
        }

        // Read any whitespace after the hashes.
        this.readWhitespace();

        // Parse some content.
        return new ParagraphNode(Math.min(3, count), this.parseFormat());
    }

    parseRule(): RuleNode {
        // Read until the end of the line. Ignore all text that follows.
        this.readUntilNewLine();

        return new RuleNode();
    }

    parseList(): ListNode {
        let numbered = this.nextMatches(numberedRE);

        const items: (FormatNode | ListNode)[] = [];
        let lastLevel = undefined;
        let currentLevel = undefined;

        // Keep parsing bullets until there aren't any. They must be of the same type, otherwise we stop.
        while (this.nextMatches(numberedRE) || this.nextMatches(bulletRE)) {
            numbered = this.nextMatches(numberedRE);

            // Remember the last level
            lastLevel = currentLevel;

            // Start the current level at 0
            currentLevel = 0;

            let digits = undefined;
            if (numbered) {
                // Read the digits and remember how many there were so we can backtrack.
                digits = this.index;
                this.readUntilNewlineOr('.');
                digits = this.index - digits;

                // Figure out this level.
                while (this.nextIs('.')) {
                    this.read();
                    currentLevel++;
                }
            } else {
                // Figure out this level.
                currentLevel = 0;
                while (this.nextIs('*')) {
                    this.read();
                    currentLevel++;
                }
            }

            // If this is the first bullet, or its the same level, just parse another bullet.
            if (lastLevel === undefined || lastLevel === currentLevel) {
                // Read the whitespace after the bullet.
                this.readWhitespace();
                // Parse content after the bullet.
                const format = this.parseFormat();
                items.push(
                    format.isEmpty()
                        ? format.withSegmentAppended(new TextNode())
                        : format
                );
            }
            // Otherwise, unread the stars, then either stop parsing or parse nested list.
            else {
                // Unread the periods/stars.
                let count = currentLevel;
                while (count > 0) {
                    this.unread();
                    count--;
                }

                // Unread the digits if there are any
                if (digits !== undefined) {
                    while (digits > 0) {
                        this.unread();
                        digits--;
                    }
                }

                // If this new bullet is a lower level, then stop reading bullets.
                if (currentLevel < lastLevel) break;
                // Otherwise, it's greater, and we should read another list.
                else {
                    items.push(this.parseList());
                    // Reset the current level to the last level, so we expect another bullet at the same level.
                    currentLevel = lastLevel;
                }
            }

            // Read trailing whitespace and newlines.
            this.readWhitespace();
            while (this.nextIsWhitespace()) {
                // Read the newline
                this.read();
                // Read whitespace before the next block.
                this.readWhitespace();
            }

            // Stop if we reach an empty paragraph.
            if (this.nextIsEmptyParagraph()) break;
        }
        return new ListNode(items, numbered);
    }

    parseCode(): CodeNode {
        // Parse the back tick
        this.read();

        // Parse through the next new line
        let language = this.readUntilNewLine();

        // Read the newline
        this.read();

        // Read until we encounter a closing back tick.
        let code = '';
        while (this.more() && !this.nextIs('`')) {
            let next = this.read(false);
            if (next === '\\') {
                if (this.nextIs('`')) {
                    this.read();
                    next = '`';
                }
            }
            code = code + next;
        }

        // Trim the code.
        code = code.trim();

        // Read the backtick.
        if (this.nextIs('`')) this.read();

        let position = this.parsePosition();

        // Read the caption. Note that parsing inline content stops at a newline,
        // so if there's a line break after the last row, there won't be a caption.
        const caption = this.parseFormat();

        return new CodeNode(new TextNode(code), language, position, caption);
    }

    parsePosition(): Position {
        let position: Position = '|';
        // Is there a position indicator?
        if (this.nextIs('<')) {
            position = '<';
            this.read();
        } else if (this.nextIs('>')) {
            position = '>';
            this.read();
        }

        return position;
    }

    parseQuote(): QuoteNode {
        const blocks: BlockNode[] = [];

        // Parse the ", then any whitespace, then the newline
        this.read();

        // Then read any whitespace after the quote
        this.readWhitespace();

        // Then read the newline.
        this.read();

        while (this.more() && !this.nextIs('"')) {
            // Read a block
            const block = this.parseBlock();
            // Add it to the list if we parsed something.
            if (block !== null) blocks.push(block);
            // Read whitespace until we find the next thing.
            while (this.nextIsWhitespace()) this.read();
        }

        // Read the closing " and the whitespace that follows.
        this.read();

        // Is there a position indicator?
        const position = this.parsePosition();

        // Read any whitespace after the position indicator.
        this.readWhitespace();

        // Read the credit.
        const credit = this.nextIs('\n') ? undefined : this.parseFormat();

        return new QuoteNode(blocks, credit, position);
    }

    parseCallout(): CalloutNode {
        const blocks: BlockNode[] = [];

        // Parse the = ...
        this.read();

        // ...then any whitespace
        this.readWhitespace();

        // ...then read the newline.
        this.read();

        // Then, read until we find a closing _
        while (this.more() && !this.nextIs('=')) {
            // Read a block
            const block = this.parseBlock();
            // Add it to the list if we parsed something.
            if (block !== null) blocks.push(block);
            // Read whitespace until we find the next thing.
            while (
                this.peek() === ' ' ||
                this.peek() === '\t' ||
                this.peek() === '\n'
            )
                this.read();
        }

        // Read the closing =
        this.read();

        // Is there a position indicator?
        const position = this.parsePosition();

        // Read whitespace that follows.
        this.readWhitespace();

        return new CalloutNode(blocks, position);
    }

    parseTable(): TableNode {
        const rows: FormatNode[][] = [];

        // Parse rows until the lines stop starting with ,
        while (this.more() && this.nextIs(',')) {
            let row = [];

            while (this.more() && !this.nextIs('\n')) {
                // Read the starting , or next |
                this.read();

                // Read whitespace that follows.
                this.readWhitespace();

                // Read content until reaching another | or the end of the line.
                row.push(this.parseFormat('|'));
            }

            // Add the row.
            rows.push(row);

            // Read the newline
            this.read();
        }

        // Read the position indicator if there is one.
        const position = this.parsePosition();

        // Read the caption. Note that parsing inline content stops at a newline,
        // so if there's a line break after the last row, there won't be a caption.
        const caption = this.parseFormat();

        // Return the new table.
        return new TableNode(rows, position, caption);
    }

    // The "awaiting" argument keeps track of upstream formatting. We don't need a stack here
    // because we don't allow infinite nesting of the same formatting type.
    parseFormat(awaiting?: string): FormatNode {
        const segments: FormatNodeSegmentType[] = [];

        // Read until hitting a delimiter.
        while (this.more() && !this.nextIs('\n')) {
            const next = this.peek();
            const charAfterNext = this.charAfterNext();

            // Parse some bold, italic, subscript, superscript
            if (next === '_' || next === '*' || next === '^')
                segments.push(this.parseStyle(next));
            // Parse a line break
            else if (this.nextIs(LINE_BREAK))
                segments.push(this.parseLineBreak());
            // Parse inline code text
            else if (this.nextIs('`')) segments.push(this.parseInlineCode());
            // Parse a citation list
            else if (this.nextIs('<')) segments.push(this.parseCitations());
            // Parse a footnote
            else if (this.nextIs('{')) segments.push(this.parseFootnote());
            // Parse a definition
            else if (this.nextIs('~')) segments.push(this.parseDefinition());
            // Parse an escaped character
            else if (this.nextIs('\\')) segments.push(this.parseEscaped());
            // Parse a link
            else if (this.nextIs('[')) segments.push(this.parseLink());
            // Parse inline comments
            else if (this.charBeforeNext() === ' ' && this.nextIs('%'))
                segments.push(this.parseComment());
            // Parse an unresolved symbol
            else if (next === '@') {
                // Read the @, then the symbol name.
                this.read();
                let symbol = '';
                // Stop at the end of the name or file.
                let next = this.peek();
                while (next !== null && /[a-zA-Z0-9]/.test(next)) {
                    symbol = symbol + this.read();
                    next = this.peek();
                }
                segments.push(
                    new ErrorNode(undefined, "Couldn't find symbol @" + symbol)
                );
            }
            // Parse a label
            else if (
                next === ':' &&
                charAfterNext !== null &&
                charAfterNext.match(/[a-z]/i)
            ) {
                segments.push(this.parseLabel());
            }
            // Keep reading text until finding a delimiter.
            else {
                let text = '';
                while (
                    this.more() &&
                    (!awaiting || !this.nextIs(awaiting)) &&
                    !this.nextIsContentDelimiter() &&
                    !this.nextIs('\n')
                )
                    text = text + this.read();
                segments.push(new TextNode(text));
            }

            // If we've reached a delimiter we're waiting for, then stop parsing, so it can handle it. Otherwise, we'll keep reading.
            if (this.peek() === awaiting) break;
        }

        return new FormatNode('', segments);
    }

    parseLineBreak(): LineBreakNode {
        // Read the line break
        this.read();

        return new LineBreakNode();
    }

    parseEmbed(): EmbedNode {
        // Read |
        this.read();

        // Read the URL
        const url = this.readUntilNewlineOr('|');

        let description;
        let caption;
        let credit;

        if (this.peek() === '|') {
            // Read a |
            this.read();

            // Read the description
            description = this.readUntilNewlineOr('|');

            if (this.peek() === '|') {
                // Read a |
                this.read();

                // Parse the caption
                caption = this.parseFormat('|');

                if (this.peek() === '|') {
                    // Read a |
                    this.read();

                    // Parse the credit
                    credit = this.parseFormat('|');

                    // Check for the closing delimeter
                    if (this.peek() === '|')
                        // Read a |
                        this.read();
                }
            }
        }

        // Is there a position indicator?
        const position = this.parsePosition();

        return new EmbedNode(url, description ?? '', caption, credit, position);
    }

    parseComment(): CommentNode {
        // Consume the opening %
        this.read();

        // Consume everything until the next %.
        const comment = this.parseFormat('%');

        // Consume the closing %, if we didn't reach the end of input or a newline.
        if (this.peek() === '%') this.read();

        return new CommentNode(comment);
    }

    parseLabel(): LabelNode | ErrorNode {
        // Consume the :
        this.read();

        // Consume everything until it's not a letter.
        let id = '';
        let next = this.peek();
        while (next !== null && next.match(/[a-z]/i)) {
            id = id + this.read();
            next = this.peek();
        }

        return new LabelNode(id);
    }

    parseStyle(awaiting: string): FormatNode | ErrorNode {
        // Remember what we're matching.
        const delimeter = this.read();
        let subscript = false;
        const segments: Array<FormatNode | TextNode | ErrorNode> = [];
        let text = '';

        // Special case subscript, which has an extra delimeter.
        if (delimeter === '^' && this.peek() === 'v') {
            this.read();
            subscript = true;
        }

        if (delimeter === null)
            return new ErrorNode(
                undefined,
                'Somehow parsing formatted text at end of file.'
            );

        // Read some content until reaching the delimiter or the end of the line
        while (this.more() && this.peek() !== delimeter && !this.nextIs('\n')) {
            // If this is more formatted text, make a text node with whatever we've accumulated so far,
            // then parse the formatted text, then reset the accumulator.
            if (this.nextIsContentDelimiter()) {
                // If the text is a non-empty string, make a text node with what we've accumulated.
                if (text !== '') segments.push(new TextNode(text));
                // Parse the formatted content.
                segments.push(this.parseFormat(awaiting));
                // Reset the accumulator.
                text = '';
            }
            // Add the next character to the accumulator.
            else {
                text = text + this.read();
            }
        }

        // If there's more text, save it!
        if (text !== '') segments.push(new TextNode(text));

        // Read the closing delimeter
        if (this.nextIs(delimeter)) this.read();
        // If it wasn't closed, add an error
        else segments.push(new ErrorNode(undefined, 'Unclosed ' + delimeter));

        return new FormatNode(
            subscript ? 'v' : (delimeter as Format),
            segments
        );
    }

    parseInlineCode(): InlineCodeNode {
        // Parse the back tick
        this.read();

        // Read until we encounter a closing back tick.
        let code = '';
        while (this.more() && !this.nextIs('`')) {
            let next = this.read(false);
            // Skip backslash of escaped characters.
            if (next === '\\') next = this.read();
            code = code + next;
        }

        // Read the backtick.
        if (this.nextIs('`')) this.read();

        // If there's a letter immediately after a backtick, it's a language for an inline code name
        let language = '';
        let next = this.peek();
        if (next !== null && /^[a-z]$/.test(next)) {
            do {
                language = language + this.read();
                next = this.peek();
            } while (next !== null && /^[a-z]$/.test(next));
        } else language = 'plaintext';

        return new InlineCodeNode(new TextNode(code), language);
    }

    parseCitations(): CitationsNode {
        let citations = '';

        // Read the <
        this.read();
        // Read the citations.
        citations = this.readUntilNewlineOr('>');
        if (this.peek() === '>') this.read();

        // Trim any whitespace, then split by commas, then remove any empty IDs.
        const citationList = citations
            .split(',')
            .map((citation) => citation.trim())
            .filter((citationID) => citationID.length > 0);

        return new CitationsNode(citationList);
    }

    parseFootnote(): FootnoteNode {
        // Read the {
        this.read();

        // Read the footnote content.
        const footnote = this.parseFormat('}');

        // Read the closing }
        this.read();

        return new FootnoteNode(footnote);
    }

    parseDefinition(): DefinitionNode {
        // Read the ~
        this.read();

        // Read the phrase
        const text = this.readUntilNewlineOr('~');

        // Read the closing ~
        this.read();

        // Read the glossary entry ID
        let glossaryID = '';
        // Stop at the end of the name or file.
        let next = this.peek();
        while (next !== null && /[a-zA-Z]/.test(next)) {
            glossaryID = glossaryID + this.read();
            next = this.peek();
        }

        return new DefinitionNode(new TextNode(text), glossaryID);
    }

    parseEscaped(): TextNode | ErrorNode {
        // Skip the scape and just add the next character.
        this.read();
        const char = this.read();
        if (char) return new TextNode(char);

        return new ErrorNode(undefined, 'Unterminated escape.');
    }

    parseLink(): LinkNode | ErrorNode {
        // Read the [
        this.read();

        // Read pure text until funding |
        const text = this.readUntilNewlineOr('|');

        // Catch missing bars
        if (this.peek() !== '|') {
            this.readUntilNewLine();
            return new ErrorNode(undefined, "Missing '|' in link");
        }

        // Read the |
        this.read();

        // Read the link
        let url = this.readUntilNewlineOr(']');

        // Catch missing closing
        if (this.peek() !== ']') {
            this.readUntilNewLine();
            return new ErrorNode(undefined, 'Missing ] in link');
        }

        // Read the ]
        this.read();

        return new LinkNode(new TextNode(text), url);
    }
}
