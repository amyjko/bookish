import Parser, { ChapterNode } from "./Parser";
import Book, { ChapterSpecification } from "./Book"
import { updateBook } from "./Firestore";

export type Match = {
	left: string,
	match: string,
	right: string
}

class Chapter {
	book: Book;
	id: string;
	bookID: string;
	title: string;
	authors: Array<string>;
	image?: string;
	numbered: boolean;
	section: string | undefined;
	forthcoming: boolean;
	text: string | undefined;
	ast: ChapterNode | undefined;
	index: Record<string, Array<Match>> | undefined;
	wordCount: number;

    constructor(book: Book, spec: ChapterSpecification) {

        this.book = book;
		this.id = spec.id;
		this.bookID = spec.bookID;
        this.title = spec.title;
        this.authors = spec.authors;
        this.image = spec.image;
        this.numbered = spec.numbered === true || spec.numbered === undefined;
        this.section = spec.section ? spec.section : undefined;
		this.forthcoming = spec.forthcoming === true;
        this.text = spec.text ? spec.text : "";

		// If the chapter has text, then parse it, count searchable words, and compute an index.
		if(this.text) {
			this.ast = Parser.parseChapter(this.book, this.text);
			this.wordCount = this.ast.toText().split(/\s+/).length;
			this.index = this.computeIndex();
		}
		// Otherwise, set them all to null.
		else {
			this.ast = undefined;
			this.wordCount = 0;
			this.index = undefined;
		}
		
    }

	toObject() {
		let payload = {
			id: this.id,
			bookID: this.bookID,
			title: this.title,
			authors: [...this.authors]
		} as ChapterSpecification

		if(this.image) payload.image = this.image;
		if(this.numbered) payload.numbered = this.numbered
		if(this.section) payload.section = this.section;
		if(this.forthcoming) payload.forthcoming = this.forthcoming;
		if(this.text) payload.text = this.text;

		return payload

	}

	getID() { return this.id; }
	setID(id: string) {
		this.id = id;
		return updateBook(this.book)
	}

    getSection(): string | undefined { return this.section; }
    isForthcoming() { return this.forthcoming; }
	isNumbered() { return this.numbered; }
    getText() { return this.text; }
    getWordCount() { return this.wordCount; }
	getAuthors() { return this.authors; }

	getTitle() { return this.title; }
	setTitle(title: string) { 
		
		this.title = title;
		return updateBook(this.book)

	}

	getImage() { return this.image; }
    getIndex() { return this.index; }
    getAST() { return this.ast; }

	// Utility function
	getReadingTime() { return this.isForthcoming() ? undefined : Math.max(1, Math.round(this.getWordCount() / 150)); }

	computeIndex(): Record<string, Match[]> | undefined {

		if(!this.ast)
			return;

		// Build a list of common words
		let commonWords: Set<string> = new Set();
		["a","about","all","also","and","are","as","at","be","because","but","by","can","come","could","day","do","does","even","find","first","for","from","get","give","go","has","have","he","her","here","him","his","how","I","if","in","into","is","it","its","just","know","like","look","make","man","many","me","more","my","new","no","not","now","of","on","one","only","or","other","our","out","people","say","see","she","so","some","take","tell","than","that","the","their","them","then","there","these","they","thing","think","this","those","time","to","two","up","use","very","want","was","way","we","well","went","what","when","which","who","will","with","would","year","yes","you","your"].forEach(
			word => commonWords.add(word)
        );

		// Get all the text in the chapter.
        let text = this.ast.toText();
		
		// Split by word boundaries.
		const words = text.split(/\b/);

		// Index the words
		const index: Record<string, Array<Match>> = {};
		words.forEach((word, wordNumber) => {

			// Skip non words. We keep them for search results.
			if(!/[a-zA-Z\u2019]+/.test(word))
				return;
		
			word = word.toLowerCase();
			
			// Should we include?
			// • It shouldn't be a common word
			// • It shouldn't have an apostrophe
			// • It should be longer than two letters
			// • It shouldn't end in 'ly'
			if(!(commonWords.has(word)) && word.indexOf('\u2019') < 0 && (word.length > 2 && word.substring(word.length - 2, word.length) !== "ly")) {
				
				// If we haven't started a list of occurrences, start one.
				if(!(word in index))
					index[word] = [];
				
				let match = {
					left: words.slice(Math.max(0, wordNumber - 10), Math.max(0, wordNumber - 1) + 1).join(""),
					match: words[wordNumber],
					right: words.slice(Math.min(words.length - 1, wordNumber + 1), Math.min(words.length - 1, wordNumber + 10) + 1).join("")
				}
				// Add the occurrence, but a lower case canonical version.
				index[word.toLowerCase()].push(match);
			}
		
		});

		return index;

	}

}

export default Chapter