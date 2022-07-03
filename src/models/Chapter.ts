import Parser from "./Parser";
import { ChapterNode } from "./ChapterNode";
import Book, { ChapterSpecification } from "./Book"
import { getChapterText, updateBook } from "./Firestore";
import { DocumentReference } from "firebase/firestore";

export type Match = {
	left: string,
	match: string,
	right: string
}

class Chapter {
	book: Book;
	ref: DocumentReference | undefined;
	chapterID: string;
	title: string;
	authors: string[];
	image?: string;
	numbered: boolean;
	section: string | undefined;
	forthcoming: boolean;
	text: string | undefined;
	ast: ChapterNode | undefined;
	index: Record<string, Array<Match>> | undefined;
	wordCount: number | undefined;

    constructor(book: Book, spec: ChapterSpecification) {

        this.book = book;
		this.ref = spec.ref;
		this.chapterID = spec.id;
        this.title = spec.title;
        this.authors = spec.authors;
        this.image = spec.image;
        this.numbered = spec.numbered === true || spec.numbered === undefined;
        this.section = spec.section ? spec.section : undefined;
		this.forthcoming = spec.forthcoming === true;

		// If the chapter has text, then parse it, count searchable words, and compute an index.
		if(spec.text !== undefined)
			this.setText(spec.text)
		else if(this.ref)
			getChapterText(this.ref).then(text => this.setText(text.text))
		// Otherwise, set them all to null.
		else {
			this.ast = undefined;
			this.wordCount = 0;
			this.index = undefined;
		}
		
    }

	toObject() {

		let payload = {
			ref: this.ref,
			id: this.chapterID,
			title: this.title,
			authors: [...this.authors]
		} as ChapterSpecification

		if(this.image !== undefined) payload.image = this.image;
		payload.numbered = this.numbered ? true : false;
		if(this.section !== undefined) payload.section = this.section;
		if(this.forthcoming) payload.forthcoming = this.forthcoming;
		if(this.text !== undefined) payload.text = this.text;

		return payload;

	}

	getBook() { return this.book }

	getRef() { return this.ref; }

	getChapterID() { return this.chapterID; }
	setChapterID(id: string) {
		if(this.chapterID !== id) {
			this.chapterID = id;
			return this.book.requestSave();
		}
	}

    getSection(): string | undefined { return this.section; }
	setSection(section: string) {
		if(this.section !== section) {
			this.section = section;
			return this.book.requestSave();
		}
	}

	isForthcoming() { return this.forthcoming; }
	setForthcoming(forthcoming: boolean) {
		if(this.forthcoming !== forthcoming) {
			this.forthcoming = forthcoming;
			return this.book.requestSave();
		}
	}

	isNumbered() { return this.numbered; }
	setNumbered(numbered: boolean) {
		if(numbered !== this.numbered) {
			this.numbered = numbered;
			return this.book.requestSave();
		}
	}

	getText() { return this.text; }
	setText(text: string) {
		if(this.text !== text || this.ast === undefined) {
			this.text = text;
			this.setAST(Parser.parseChapter(this.book, this.text));
		}
	}

	setAST(node: ChapterNode) {

		this.ast = node;
		const newText = this.ast.toBookdown();
		const changed = this.text !== newText;
		this.text = newText;
		this.wordCount = this.ast.toText().split(/\s+/).length;
		this.index = this.computeIndex();

		// Don't save if its the same. This is just an optimization.
		if(changed)
			return this.book.requestSave();

	}

	addAuthor(name: string) {
        this.authors.push(name);
		return this.book.requestSave();
    }

	getAuthors() { return this.authors; }
    setAuthor(index: number, name: string) {
        if(index >= 0 && index < this.authors.length) {
            this.authors[index] = name;
			return this.book.requestSave();
		}
	}

    removeAuthor(index: number) {
        if(index >= 0 && index < this.authors.length) {
            this.authors.splice(index, 1)
			return this.book.requestSave();
		}
	}

	getTitle() { return this.title; }
	setTitle(title: string) {
		if(title !== this.title) {
			this.title = title;
			return this.book.requestSave();
		}
	}

	getPosition() { return this.book.getChapterPosition(this.getChapterID()) }
	move(increment: number) { return this.book.moveChapter(this.getChapterID(), increment); }

	delete() { return this.book.deleteChapter(this.getChapterID()) }

	getImage() { return this.image; }
	setImage(embed: string | undefined) { 
		if(this.image === embed) return;
		this.image = embed;
		return this.book.requestSave();
	}

    getIndex() { return this.index; }
    getAST() { return this.ast; }

	// Utility function
	getReadingTime() { return this.isForthcoming() || !this.wordCount ? undefined : Math.max(1, Math.round(this.wordCount / 150)); }

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