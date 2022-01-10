import Parser, { ChapterNode } from "./Parser";
import Book from "./Book"

type Match = {
	left: string,
	match: string,
	right: string
}

class Chapter {
	book: Book;
	id: string;
	title: string;
	authors: Array<string>;
	image: string;
	numbered: boolean;
	section: string | null;
	forthcoming: boolean;
	text: string;
	ast: ChapterNode | null;
	index: Record<string, Array<Match>> | null;
	wordCount: number;

    constructor(book: Book, spec) {

        this.book = book;
        this.id = spec.id;
        this.title = spec.title;
        this.authors = spec.authors;
        this.image = spec.image;
        this.numbered = "numbered" in spec ? spec.numbered : false;
        this.section = "section" in spec ? spec.section : null;
		this.forthcoming = spec.forthcoming === true;
        this.text = "text" in spec ? spec.text : null;

		// If the chapter has text, then parse it, count searchable words, and compute an index.
		if(this.text !== null) {
			this.ast = Parser.parseChapter(this.book, this.text);
			this.wordCount = this.ast.toText().split(/\s+/).length;
			this.index = this.computeIndex();
		}
		// Otherwise, set them all to null.
		else {
			this.ast = null;
			this.wordCount = 0;
			this.index = null;
		}
		
    }

	toObject() {
		return {
			id: this.id,
			title: this.title,
			authors: [...this.authors],
			image: this.image,
			numbered: this.numbered,
			section: this.section,
			forthcoming: this.forthcoming,
			text: this.text
		}

	}

	getID() { return this.id; }
    getSection() { return this.section; }
    isForthcoming() { return this.forthcoming; }
	isNumbered() { return this.numbered; }
    getText() { return this.text; }
    getWordCount() { return this.wordCount; }
	getAuthors() { return this.authors; }
    getTitle() { return this.title; }
	getImage() { return this.image; }
    getIndex() { return this.index; }
    getAST() { return this.ast; }

	// Utility function
	getReadingTime() { return this.isForthcoming() ? undefined : Math.max(1, Math.round(this.getWordCount() / 150)); }

	computeIndex(): Record<string, Array<Match>> {

		// Build a list of common words
		let commonWords = {};
		["a","about","all","also","and","are","as","at","be","because","but","by","can","come","could","day","do","does","even","find","first","for","from","get","give","go","has","have","he","her","here","him","his","how","I","if","in","into","is","it","its","just","know","like","look","make","man","many","me","more","my","new","no","not","now","of","on","one","only","or","other","our","out","people","say","see","she","so","some","take","tell","than","that","the","their","them","then","there","these","they","thing","think","this","those","time","to","two","up","use","very","want","was","way","we","well","went","what","when","which","who","will","with","would","year","yes","you","your"].forEach(
			word => commonWords[word] = true
        );

		// Get all the text in the chapter.
        let text = this.ast.toText();
		
		// Split by word boundaries.
		const words = text.split(/\b/);

		// Index the words
		const index = {};
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
			if(!(word in commonWords) && word.indexOf('\u2019') < 0 && (word.length > 2 && word.substring(word.length - 2, word.length) !== "ly")) {
				
				// If we haven't started a list of occurrences, start one.
				if(!(word in index))
					index[word] = [];
				
				let match = {
					left: words.slice(Math.max(0, wordNumber - 10), Math.max(0, wordNumber - 1) + 1).join(""),
					match: words[wordNumber],
					right: words.slice(Math.min(words.length - 1, wordNumber + 1), Math.min(words.length - 1, wordNumber + 10) + 1).join("")
				}
				// Add the occurrence
				index[word].push(match);
			}
		
		});

		return this.book.cleanIndex(index);

	}

}

export { Chapter };