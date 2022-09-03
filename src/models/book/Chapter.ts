import Parser from "../chapter/Parser";
import { ChapterNode } from "../chapter/ChapterNode";
import Edition, { BookSaveStatus } from "./Edition"
import { loadChapterTextFromFirestore, updateChapterTextInFirestore } from "../Firestore";
import { DocumentReference } from "firebase/firestore";

export type ChapterSpecification = {
    ref?: DocumentReference;
	id: string;
    title: string;
    authors: string[];
    image: string | null;
    numbered: boolean;
    forthcoming: boolean;
    section?: string;
	text?: string;
}

export type ChapterContent = {
    text: string
}

export type Match = {
	left: string,
	match: string,
	right: string
}

export default class Chapter {

	// The metadata from the database.
	readonly spec: ChapterSpecification;

	edition: Edition;
	
	// Caches
	ast: ChapterNode | undefined;
	index: Record<string, Array<Match>> | undefined;
	wordCount: number | undefined;

	// A list of requested edits, stored as promises, resolved
    // when the book is ready to save.
    edits: { resolve: Function, reject: Function }[] = [];

	// The timer that checks for inactivity.
    timerID: NodeJS.Timer | undefined;
    lastEdit: number = 0;

	// A set of listeners that are notified when the chapter text changes.
	listeners = new Set<(text: string) => void>();

    constructor(edition: Edition, spec: ChapterSpecification) {

		this.edition = edition;

		// Copy the spec, filling in defaults as necessary.
		this.spec = {
			ref: spec.ref,
			id: spec.id,
			title: spec.title,
			authors: spec.authors ?? [],
			image: spec.image ?? null,
			numbered: spec.numbered === true || spec.numbered === undefined,
			forthcoming: spec.forthcoming === true,
			text: spec.text
		}

		// If the chapter has text, then parse it, count searchable words, and compute an index.
		if(this.spec.text !== undefined)
			this.setText(this.spec.text)
		else if(this.spec.ref) {
			loadChapterTextFromFirestore(this.spec.ref).then(text => this.setText(text.text))
		}
		// Otherwise, set them all to undefined.
		else {
			this.ast = undefined;
			this.wordCount = 0;
			this.index = undefined;
		}
		
        // Periodically check for inactivity, pooling edits until after an idle state.
		this.timerID = setInterval(() => {
			if(this.edition.editionRef && this.spec.ref && this.spec.text) {
				// If it's been more than a second since our last edit and there
				// are edits that haven't been saved, try updating the book, 
				// and if we succeed, resolve all of the edits, and if we fail,
				// then reject them.
				if(Date.now() - this.lastEdit > 1000 && this.edits.length > 0) {
					// Tell listeners that this book model changed.
					this.edition.notifyListeners(BookSaveStatus.Saving);
					updateChapterTextInFirestore(this.edition.editionRef, this.spec.ref, this.spec.text)
						.then(() => {
							// Approve the edits.
							this.edits.forEach(edit => edit.resolve());
							this.edition.notifyListeners(BookSaveStatus.Saved);
						})
						.catch(() => {
							// Reject the edits.
							this.edits.forEach(edit => edit.reject());
							this.edition.notifyListeners(BookSaveStatus.Error);
						})
						.finally(() => {
							// Reset the edit queue.
							this.edits = [];
						})
				}
			}
		}, 500);

    }

	addListener(listener: (text: string) => void) { this.listeners.add(listener); }
    removeListener(listener: (text: string) => void) { this.listeners.delete(listener); }
    notifyListeners() { 
		this.listeners.forEach(listener => this.spec.text !== undefined ? listener.call(undefined, this.spec.text) : undefined); 
	}

    // Adds a save request to the queue, to be resolved later after a period of
    // inactivity. Returns a promise that will eventually be resolved.
    requestSave() {
        // Tell listeners that this book model changed.
        this.edition.notifyListeners(BookSaveStatus.Changed);

        // Return a promise that will resolve or reject later after this model saves the edits to the database.
        this.lastEdit = Date.now();
        const promise = new Promise<void>((resolve, reject) => {
            this.edits.push({ resolve: resolve, reject: reject })
        });
        return promise;
    }

	toObject() {

		// Deep copy to prevent external mutations.
		const payload = JSON.parse(JSON.stringify(this.spec));

		// Reassign a copy of the Firebase ref, since the deep copy doesn't work for it.
		payload.ref = this.spec.ref;

		// Note that we don't include the chapter text in the payload; that's stored in the chapters subcollection.
		// We just return the chapter metadata here, which is stored in the book collection.
		delete payload.text;

		return payload;

	}

	getBook() { return this.edition }

	getRef() { return this.spec.ref; }

	getChapterID() { return this.spec.id; }
	setChapterID(id: string) {
		if(this.spec.id !== id) {
			this.spec.id = id;
			return this.edition.requestSave();
		}
	}

    getSection(): string | undefined { return this.spec.section; }
	setSection(section: string) {
		if(this.spec.section !== section) {
			this.spec.section = section;
			return this.edition.requestSave();
		}
	}

	isForthcoming() { return this.spec.forthcoming; }
	setForthcoming(forthcoming: boolean) {
		if(this.spec.forthcoming !== forthcoming) {
			this.spec.forthcoming = forthcoming;
			return this.edition.requestSave();
		}
	}

	isNumbered() { return this.spec.numbered; }
	setNumbered(numbered: boolean) {
		if(numbered !== this.spec.numbered) {
			this.spec.numbered = numbered;
			return this.edition.requestSave();
		}
	}

	getText() { return this.spec.text; }
	setText(text: string) {
		if(this.spec.text !== text || this.ast === undefined) {
			this.spec.text = text;
			this.setAST(Parser.parseChapter(this.edition, this.spec.text));
			this.notifyListeners();
		}
	}

	setAST(node: ChapterNode) {

		this.ast = node;
		const newText = this.ast.toBookdown();
		const changed = this.spec.text !== newText;
		this.spec.text = newText;
		this.wordCount = this.ast.toText().split(/\s+/).length;
		this.index = this.computeIndex();

		// Don't save if its the same. This is just an optimization.
		if(changed) {
			if(this.edition.editionRef && this.spec.ref)
				return this.requestSave();
		}

	}

	addAuthor(name: string) {
        this.spec.authors.push(name);
		return this.edition.requestSave();
    }

	getAuthors() { return this.spec.authors; }
    setAuthor(index: number, name: string) {
        if(index >= 0 && index < this.spec.authors.length) {
            this.spec.authors[index] = name;
			return this.edition.requestSave();
		}
	}

    removeAuthor(index: number) {
        if(index >= 0 && index < this.spec.authors.length) {
            this.spec.authors.splice(index, 1)
			return this.edition.requestSave();
		}
	}

	getTitle() { return this.spec.title; }
	setTitle(title: string) {
		if(title !== this.spec.title) {
			this.spec.title = title;
			return this.edition.requestSave();
		}
	}

	getPosition() { return this.edition.getChapterPosition(this.getChapterID()) }
	move(increment: number) { return this.edition.moveChapter(this.getChapterID(), increment); }

	delete() { return this.edition.deleteChapter(this.getChapterID()) }

	getImage() { return this.spec.image; }
	setImage(embed: string | null) { 
		if(this.spec.image === embed) return;
		this.spec.image = embed;
		return this.edition.requestSave();
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