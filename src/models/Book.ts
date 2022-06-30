import Parser from "./Parser";
import { EmbedNode } from "./EmbedNode";
import Chapter from './Chapter.js';
import { addChapter, removeChapter, updateBook } from "./Firestore";
import { DocumentReference } from "firebase/firestore";
import { ReferenceNode } from "./ReferenceNode";

export type ChapterSpecification = {
    ref: DocumentReference | undefined;
    id: string;
    title: string;
    authors: string[];
    image?: string;
    numbered?: boolean;
    forthcoming?: boolean;
    section?: string;
    text?: string;
}

export type ChapterContent = {
    text: string
}

export type BookPreview = {
    ref: DocumentReference;
    title: string;
    authors: string[];
    description: string;
}

export type Definition = { phrase: string, definition: string, synonyms?: string[]}

export type BookSpecification = {
    title: string;
    authors: string[];
    images: Record<string, string>;
    description: string;
    chapters: ChapterSpecification[];
    license: string;
    acknowledgements?: string;
    tags?: string[];
    revisions?: Array<[string, string]>;
    sources?: Record<string, string>;
    references?: Record<string, string | string[]>;
    symbols?: Record<string, string>;
    glossary?: Record<string, Definition>;
    uids?: Array<string>;
}

export enum BookSaveStatus {
    Changed,
    Saving,
    Saved,
    Error
}

export default class Book {

    static TableOfContentsID = "";
    static ReferencesID = "references";
    static SearchID = "search";
	static MediaID = "media";
    static IndexID = "index";
	static GlossaryID = "glossary";

    ref: DocumentReference | undefined;
    title: string;
    symbols: Record<string, string>;
    tags: string[];
    license: string;
    references: Record<string, string | Array<string>>;
    glossary: Record<string, { phrase: string, definition: string, synonyms?: string[]}>;
    authors: string[];
    description: string;
    acknowledgements: string;
    revisions: Array<[string, string]>;
    images: Record<string, string>;
    sources: Record<string, string>;
    uids: string[];
    chapters: Chapter[];
    chaptersByID: Record<string, Chapter | undefined>;

    listeners: Set<Function>;

    // A list of requested edits, stored as promises, resolved
    // when the book is ready to save.
    edits: { resolve: Function, reject: Function }[] = [];

    // The timer that checks for inactivity.
    timerID: NodeJS.Timer | undefined;
    lastEdit: number = 0;

    // Given an object with a valid specification and an object mapping chapter IDs to chapter text,
    // construct an object representing a book.
    constructor(ref: DocumentReference | undefined, specification?: BookSpecification) {

        if(typeof specification !== "object" && specification !== undefined)
            throw Error("Expected a book specification object, but received " + specification)

        this.ref = ref

        // Copy all of the specification metadata to fields.
        // Choose suitable defaults if the spec is empty.
        this.title = specification ? specification.title : "Untitled"
        this.symbols = specification && specification.symbols ? specification.symbols : {}
        this.tags = specification && specification.tags ? specification.tags : []
        this.license = specification ? specification.license : "All rights reserved.",
        this.references = specification && specification.references ? specification.references : {}
        this.glossary = specification && specification.glossary ? specification.glossary : {}
        this.authors = specification && specification.authors ? specification.authors : []
        this.description = specification ? specification.description : "What's your book about?"
        this.acknowledgements = specification && specification.acknowledgements ? specification.acknowledgements : ""
        this.revisions = specification && specification.revisions ? specification.revisions : []
        this.images = specification && specification.images ? specification.images : {}
        this.sources = specification && specification.sources ? specification.sources : {}
        this.uids = specification && specification.uids ? specification.uids : []

        // No listeners yet
        this.listeners = new Set()

        // Create a list and dictionary of Chapter objects.
        this.chapters = []
        this.chaptersByID = {}

        // If there's a spec and it has chapters, process them.
        if(specification && specification.chapters.length > 0) {
            // Initialize the chapters dictionary since parsing depends this index to detect whether a chapter exists.
            specification.chapters.forEach(chapter => this.chaptersByID[chapter.id] = undefined)
            specification.chapters.forEach(chapter => {
                const chap = new Chapter(this, chapter)
                this.chaptersByID[chapter.id] = chap
                this.chapters.push(chap)
            })
        }

        // Periodically check for inactivity, and then update the book.
        this.timerID = setInterval(() => {
            // If it's been more than a second since our last edit and there
            // are edits that haven't been saved, try updating the book, 
            // and if we succeed, resolve all of the edits, and if we fail,
            // then reject them.
            if(Date.now() - this.lastEdit > 1000 && this.edits.length > 0) {
                // Tell listeners that this book model changed.
                this.notifyListeners(BookSaveStatus.Saving);
                updateBook(this)
                    .then(() => {
                        // Approve the edits.
                        this.edits.forEach(edit => edit.resolve());
                        this.notifyListeners(BookSaveStatus.Saved);
                    })
                    .catch(() => {
                        // Reject the edits.
                        this.edits.forEach(edit => edit.reject());
                        this.notifyListeners(BookSaveStatus.Error);
                    })
                    .finally(() => {
                        // Reset the edit queue.
                        this.edits = [];
                    })
            }
        }, 500);

    }

    addListener(listener: (status: BookSaveStatus) => void) { this.listeners.add(listener); }
    removeListener(listener: Function) { this.listeners.delete(listener); }
    notifyListeners(status: BookSaveStatus) { this.listeners.forEach(listener => listener.call(undefined, status)); }

    // Adds a save request to the queue, to be resolved later after a period of
    // inactivity. Returns a promise that will eventually be resolved.
    requestSave() {
        // Tell listeners that this book model changed.
        this.notifyListeners(BookSaveStatus.Changed);

        // Return a promise that will resolve or reject later after this model saves the edits to the database.
        this.lastEdit = Date.now();
        const promise = new Promise<void>((resolve, reject) => {
            this.edits.push({ resolve: resolve, reject: reject })
        });
        return promise;
    }

    // Convert the book back into JSON for storage. Deep copies arrays and objects to avoid other code mutating this object.
    toObject() {

        return {
            title: this.title,
            authors: JSON.parse(JSON.stringify(this.authors)),
            uids: JSON.parse(JSON.stringify(this.uids)),
            images: JSON.parse(JSON.stringify(this.images)),
            description: this.description,
            acknowledgements: this.acknowledgements,
            chapters: this.chapters.map(chapter => chapter.toObject()),
            tags: JSON.parse(JSON.stringify(this.tags)),
            revisions: JSON.parse(JSON.stringify(this.revisions)),
            license: this.license,
            sources: JSON.parse(JSON.stringify(this.sources)),
            references: JSON.parse(JSON.stringify(this.references)),
            symbols: JSON.parse(JSON.stringify(this.symbols)),
            glossary: JSON.parse(JSON.stringify(this.glossary))
        }

    }

    getRef() { return this.ref }

    addUserID(uid: string) {
        this.uids.push(uid);
    }

    getTitle() { return this.title; }
    setTitle(title: string): Promise<void> { 
        // Update locally, then update on the server.
        this.title = title;
        return this.requestSave();

    }

    getDescription() { return this.description; }
    setDescription(text: string) { 
        // Update locally, then update on the server.
        this.description = text;
        return this.requestSave();
    }

	getAcknowledgements() { return this.acknowledgements; }
    setAcknowledgements(text: string) { 
        // Update locally, then update on the server.
        this.acknowledgements = text;
        return this.requestSave();
    }

    getLicense() { return this.license; }
    setLicense(text: string) { 
        // Update locally, then update on the server.
        this.license = text;
        return this.requestSave();
    }

    getChapters() { return this.chapters }
    hasChapter(chapterID: string): boolean { return chapterID in this.chaptersByID || ["references", "glossary", "index", "search", "media"].includes(chapterID); }
    getChapter(chapterID: string): Chapter | undefined { return this.hasChapter(chapterID) ? this.chaptersByID[chapterID] : undefined; }
    getChapterPosition(chapterID: string): number | undefined {
        var position = 0;
        for(; position < this.chapters.length; position++)
            if(this.chapters[position].getChapterID() === chapterID)
                return position;

        return undefined;
    }
    getChapterCount() { return this.chapters.length }

    async addChapter() {

        if(!this.ref)
            throw Error("No book ID, can't add chapter")

        const bookID = this.ref

        // Synthesize a chapter ID placeholder that doesn't overlap with existing chapter names
        let number = 1;
        while(this.hasChapter("chapter" + number))
            number++;

        const chapterRef = await addChapter(bookID, { text: "" })

        // Create a default chapter on this model
        const emptyChapter = {
            ref: chapterRef,
            id: `chapter${number}`,
            title: "Untitled Chapter",
            authors: [],
            forthcoming: true
        }

        const chap = new Chapter(this, emptyChapter)
        this.chapters.push(chap);
        this.chaptersByID[emptyChapter.id] = chap

        // Ask the database to create the chapter, returning the promise
        return this.requestSave();

    }

    moveChapter(chapterID: string, increment: number): Promise<void> {

        // Get the index of the chapter.
        let index = this.chapters.findIndex(chapter => chapter.getChapterID() === chapterID);
        if(index < 0)
            throw Error(`Chapter with ID ${chapterID} doesn't exist, can't move it.`)
        else if(index + increment < 0)
            throw Error(`Can't move this chapter ${increment} chapters earlier.`)
        else if(index + increment >= this.chapters.length)
            throw Error(`Can't move this chapter ${increment} chapters later.`)

        const temp = this.chapters[index + increment]
        this.chapters[index + increment] = this.chapters[index]
        this.chapters[index] = temp

        // Ask the database to update with this new order.
        return this.requestSave();

    }

    deleteChapter(chapterID: string): Promise<void> {

        let index = this.chapters.findIndex(chapter => chapter.getChapterID() === chapterID);
        if(index < 0)
            throw Error(`Chapter with ID ${chapterID} doesn't exist, can't delete it.`)

        const chapter = this.chapters[index]
        this.chapters.splice(index, 1);

        // Ask the database to update the new book metadata then delete the chapter.
        return this.requestSave().then(() => removeChapter(chapter));

    }

    getSymbols() { return this.symbols }

    hasReferences() { return this.references && Object.keys(this.references).length > 0; }
	getReferences() { return this.references; }
    getReference(citationID: string) { return this.references[citationID]; }
    addReferences(references: ReferenceNode[]) {
        // Generate a unique ID for the reference.
        references.forEach(ref => this.references[ref.citationID] = ref.toList());
        return this.requestSave();
    }
    editReference(ref: ReferenceNode) {
        if(!(ref.citationID in this.references)) return;
        this.references[ref.citationID] = ref.toList();
        return this.requestSave(); 
    }
    editReferenceID(newCitationID: string, ref: ReferenceNode) {
        if(!(ref.citationID in this.references)) return;
        delete this.references[ref.citationID];
        this.references[newCitationID] = ref.withCitationID(newCitationID).toList();
        return this.requestSave(); 
    }
    removeReference(citationID: string) {
        if(!(citationID in this.references)) return;
        delete this.references[citationID];
        return this.requestSave();
    }

    hasGlossary() { return this.glossary && Object.keys(this.glossary).length > 0 }
	getGlossary() { return this.glossary }
    hasDefinition(id: string) { return id in this.glossary; }
    addDefinition(id: string, phrase: string, definition: string, synonyms: string[]) {
        this.glossary[id] = {
            phrase: phrase,
            definition: definition,
            synonyms: synonyms
        }
        return this.requestSave();
    }

	getTags() { return this.tags }

	getAuthors() { return this.authors; }

    addAuthor(name: string) {
        this.authors.push(name)
        return this.requestSave();
    }

    setAuthor(index: number, name: string) {
        if(index >= 0 && index < this.authors.length)
            this.authors[index] = name;

            return this.requestSave();
    }

    removeAuthor(index: number) {
        if(index >= 0 && index < this.authors.length)
            this.authors.splice(index, 1);

        return this.requestSave();
    }

	getRevisions() { return this.revisions; }

    hasImage(id: string) { return id in this.images; }
    getImage(id: string) { return this.hasImage(id) ? this.images[id] : undefined; }
	
	getBookReadingTime() {
		return this.chapters
                .map(chapter => chapter.getReadingTime())
                .reduce((total, time) => 
                    total === undefined ? 0 : 
                    time === undefined ? 
                        total : total + time, 0
                );
	}

	getChapterNumber(chapterID: string) {

        let chapterNumber = 1;
        let match = null;
        this.chapters.forEach(chapter => {
            // If we found a match...
            if(chapter.getChapterID() === chapterID) {
                match = chapterNumber;
                // And it's an unnumbered chapter, set to null.
                if(!chapter.isNumbered())
                    match = null;
            } 
            // Otherwise, increment if it's numbered.
            else if(chapter.isNumbered())
                chapterNumber++;
        });
        // Remember the number if we found it.
        if(match !== null) return match;
        else return undefined;

	}

	getSource(sourceID: string) { 
		return sourceID.charAt(0) === "#" && sourceID.substring(1) in this.sources ? 
            this.sources[sourceID.substring(1)] : 
            null;
	}

	getChapterName(chapterID: string): string | undefined { 
        const chapter = this.getChapter(chapterID);
        return chapter?.getTitle()
    }

    getChapterSection(chapterID: string): string | undefined { 
        const chapter = this.chaptersByID[chapterID];
        return chapter?.getSection();
    }

	getFootnoteSymbol(number: number) {

		let symbols = "abcdefghijklmnopqrstuvwxyz";
        // Let's hope there are never more than 26^2 footnotes in a single chapter...
        return number < symbols.length ?
            symbols.charAt(number) :
            symbols.charAt(Math.floor(number / symbols.length) - 1) + symbols.charAt(number % symbols.length);

	}

    getBookIndex(): Record<string, Set<string>> {

        // A map from word to a map of chapters containing the word
		const bookIndex: Record<string, Set<string>> = {};

		// Construct the index by building a dictionary of chapters in which each word appears.
		this.chapters.forEach(chapter => {
            let index = chapter.getIndex();
            if(index)
			    Object.keys(index).forEach(word => {
                    if(word !== "" && word.length > 2) {
                        if(!(word in bookIndex))
                            bookIndex[word] = new Set();
                        bookIndex[word].add(chapter.chapterID);
                    }
                });
		});

        return bookIndex;

	}

	// Given the current chapter, find the available chapter after it.
    getNextChapterID(chapterID: string) {

        // Handle back matter chapters.
        switch(chapterID) {
            case Book.ReferencesID: return this.hasGlossary() ? Book.GlossaryID : Book.IndexID;
            case Book.GlossaryID: return Book.IndexID;
            case Book.IndexID: return Book.SearchID;
            case Book.SearchID: return Book.MediaID;
            case Book.MediaID: return Book.TableOfContentsID;
            case Book.TableOfContentsID: return this.chapters.length > 0 ? this.chapters[0].getChapterID() : null;
            default:
                let after = false;
                for(let i = 0; i < this.chapters.length; i++) {
                    let chapter = this.chapters[i];
                    if(chapter.getChapterID() === chapterID)
                        after = true;
                    // If we're after the given chapter and it's not forthcoming.
                    else if(after && !chapter.isForthcoming())
                        return chapter.getChapterID();
                }
                // If the given ID was the last chapter, go to the next back matter chapter.
                if(after)
                    return this.hasReferences() ? Book.ReferencesID : this.hasGlossary() ? Book.GlossaryID : Book.IndexID;
                // Otherwise, it wasn't a valid ID
                else
                    return null;
        }

	}

	// Given a chapter id, find the available chapter before it.
	getPreviousChapterID(chapterID: string) {

        switch(chapterID) {

            // Handle back matter chapters.
            case Book.ReferencesID: return this.chapters.length > 0 ? this.chapters[this.chapters.length - 1].chapterID : null; // Last chapter of the book
            case Book.GlossaryID: return this.hasReferences() ? Book.ReferencesID : this.chapters.length > 0 ? this.chapters[this.chapters.length - 1].chapterID : Book.TableOfContentsID;
            case Book.IndexID: return this.hasGlossary() ? Book.GlossaryID : this.hasReferences() ? Book.ReferencesID : this.chapters.length > 0 ? this.chapters[this.chapters.length - 1].chapterID : Book.TableOfContentsID;
            case Book.SearchID: return Book.IndexID;
            case Book.MediaID: return Book.SearchID;
            default:
                let before = false;
                for(let i = this.chapters.length - 1; i >= 0; i--) {
                    let chapter = this.chapters[i];
                    if(chapter.getChapterID() === chapterID)
                        before = true;
                    // If we're before the given chapter and it's not forthcoming.
                    else if(before && !chapter.isForthcoming())
                        return chapter.getChapterID();
                }
                // If the given ID was the last chapter, go to the next back matter chapter.
                if(before)
                    return Book.TableOfContentsID;
                // Otherwise, it wasn't a valid ID
                else
                    return null;
        }

	}

    // Get all of the embeds in the book
    getMedia(): EmbedNode[] {

        let media: EmbedNode[] = [];
        let urls = new Set(); // This just prevents duplicates.

        // Add the book cover
        const cover = this.getImage("cover")
        if(cover) {
            let coverNode = Parser.parseEmbed(this, cover);
            if(coverNode instanceof EmbedNode)
                media.push(coverNode);
        }

        // Add the cover and images from each chapter.
		this.getChapters().forEach(c => {

            const image = c.getImage()
            let cover = image === undefined ? undefined : Parser.parseEmbed(this, image);
            if(cover && cover instanceof EmbedNode && !urls.has(cover.getURL())) {
                media.push(cover);
                urls.add(cover.getURL());
            }

            let embeds = c?.getAST()?.getEmbeds();
            if(embeds)
                embeds.forEach((embed: EmbedNode) => {
                    if(!urls.has(embed.getURL())) {
                        media.push(embed);
                        urls.add(embed.getURL());
                    }
                })

        });

        // Add the back matter covers
        let backmatter = ["references", "glossary", "index", "search", "media"];
        backmatter.forEach(id => {
            const img = this.getImage(id)
            if(img) {
                let image = Parser.parseEmbed(this, img);
                if(image instanceof EmbedNode && !urls.has(image.getURL())) {
                    media.push(image);
                    urls.add(image.getURL());
                }    
            }
        });

        return media;

    }

}