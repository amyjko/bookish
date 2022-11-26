import Chapter from './Chapter'
import type { ChapterSpecification } from './Chapter'
import Parser from "../chapter/Parser"
import EmbedNode from "../chapter/EmbedNode"
import type ReferenceNode from "../chapter/ReferenceNode"
import { addChapterInFirestore, removeChapterFromEditionInFirestore, updateEditionInFirestore } from "../Firestore"
import type Theme from './Theme';
import type Definition from './Definition.js'
import type Book from './Book.js'
import ChapterIDs from './ChapterID.js'
import type { DocumentReference } from 'firebase/firestore'

export type EditionSpecification = {
    title: string;
    authors: string[];
    images: Record<string, string | null>;
    description: string;
    chapters: ChapterSpecification[];
    license: string;
    acknowledgements: string;
    tags: string[];
    revisions: [string, string][];
    sources: Record<string, string>;
    references: Record<string, string | string[]>;
    symbols: Record<string, string>;
    glossary: Record<string, Definition>;
    theme: Theme | null;
    uids: Array<string>;
    bookRef?: DocumentReference;
}

export enum BookSaveStatus {
    Changed,
    Saving,
    Saved,
    Error
}

export default class Edition {

    readonly specification: EditionSpecification;
    readonly book: Book | undefined;
    editionRef: DocumentReference | undefined;

    chapters: Chapter[];

    listeners: Set<Function>;

    // A list of requested edits, stored as promises, resolved
    // when the book is ready to save.
    edits: { resolve: Function, reject: Function }[] = [];

    lastEdit: number = 0;

    // Given an object with a valid specification and an object mapping chapter IDs to chapter text,
    // construct an object representing a book.
    constructor(book?: Book, editionRef?: DocumentReference, specification?: EditionSpecification) {

        if(typeof specification !== "object" && specification !== undefined)
            throw Error("Expected a book specification object, but received " + specification)
            
        this.book = book;
        this.editionRef = editionRef

        // Copy all of the specification metadata to fields.
        // Choose suitable defaults if the spec is lacking a field.
        this.specification = {
            title: specification ? specification.title : "Untitled",
            symbols: specification && specification.symbols ? specification.symbols : {},
            tags: specification && specification.tags ? specification.tags : [],
            license: specification ? specification.license : "All rights reserved.",
            references: specification && specification.references ? specification.references : {},
            glossary: specification && specification.glossary ? specification.glossary : {},
            authors: specification && specification.authors ? specification.authors : [],
            description: specification ? specification.description : "",
            acknowledgements: specification && specification.acknowledgements ? specification.acknowledgements : "",
            revisions: specification && specification.revisions ? specification.revisions : [],
            images: specification && specification.revisions ? specification.images : {},
            sources: specification && specification.revisions ? specification.sources : {},
            theme: specification && specification.theme ? specification.theme : null,
            uids: specification && specification.uids ? specification.uids : [],
            chapters: specification && specification.chapters ? specification.chapters : []
        };

        // No listeners yet
        this.listeners = new Set()

        // Create a list and dictionary of Chapter objects.
        this.chapters = []

        // If there's a spec and it has chapters, process them.
        if(this.specification.chapters.length > 0) {
            // Initialize the chapters dictionary since parsing depends this index to detect whether a chapter exists.
            this.specification.chapters.forEach(chapterSpec => {
                const chap = new Chapter(this, chapterSpec)
                this.chapters.push(chap)
            })
        }

    }

    setRef(ref: DocumentReference) {
        if(this.editionRef) throw Error("Can only set a ref of an edition when not yet set.");
        this.editionRef = ref;
    }

    async saveEdits() { 
        // If it's been more than a second since our last edit and there
        // are edits that haven't been saved, try updating the book, 
        // and if we succeed, resolve all of the edits, and if we fail,
        // then reject them.
        if(Date.now() - this.lastEdit > 1000 && this.edits.length > 0) {
            // Tell listeners that this book model changed.
            this.notifyListeners(BookSaveStatus.Saving);
            return updateEditionInFirestore(this)
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

    }

    getBook() { return this.book; }

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

    // Convert the book to an object for storage.
    toObject() {

        // Deep copy, then let the chapter models handle the chapters.
        const spec = JSON.parse(JSON.stringify(this.specification));
        spec.chapters = this.chapters.map(chapter => chapter.toObject());
        return spec;

    }

    getRef() { return this.editionRef }

    addUserID(uid: string) {
        this.specification.uids.push(uid);
    }

    getTitle() { return this.specification.title; }
    setTitle(title: string): Promise<void> { 
        // Update locally, then update on the server.
        this.specification.title = title;
        return this.requestSave();
    }

    getDescription() { return this.specification.description; }
    setDescription(text: string) { 
        // Update locally, then update on the server.
        this.specification.description = text;
        return this.requestSave();
    }

	getAcknowledgements() { return this.specification.acknowledgements; }
    setAcknowledgements(text: string) { 
        // Update locally, then update on the server.
        this.specification.acknowledgements = text;
        return this.requestSave();
    }

    getLicense() { return this.specification.license; }
    setLicense(text: string) { 
        // Update locally, then update on the server.
        this.specification.license = text;
        return this.requestSave();
    }

    getChapters() { return this.chapters }
    hasChapter(chapterID: string): boolean { return this.getChapter(chapterID) !== undefined || ["references", "glossary", "index", "search", "media"].includes(chapterID); }
    getChapter(chapterID: string): Chapter | undefined { return this.chapters.find(chapter => chapter.getChapterID() === chapterID); }
    getChapterPosition(chapterID: string): number | undefined {
        var position = 0;
        for(; position < this.chapters.length; position++)
            if(this.chapters[position].getChapterID() === chapterID)
                return position;

        return undefined;
    }
    getChapterCount() { return this.chapters.length }

    async addChapter() {

        if(!this.editionRef)
            throw Error("No edition ID, can't add chapter")

        const editionID = this.editionRef;

        // Synthesize a chapter ID placeholder that doesn't overlap with existing chapter names
        let number = 1;
        while(this.hasChapter("chapter" + number))
            number++;

        const chapterRef = await addChapterInFirestore(editionID, { text: "" })

        // Create a default chapter on this model. Remember the document reference so we can modify it later.
        const emptyChapter = {
            ref: chapterRef,
            id: `chapter${number}`,
            title: "Untitled Chapter",
            authors: [],
            numbered: true,
            forthcoming: true,
            image: null
        }

        const chap = new Chapter(this, emptyChapter);
        this.chapters.push(chap);

        // Ask the database to create the chapter, returning the promise
        this.requestSave();

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

    async deleteChapter(chapterID: string): Promise<void> {

        let index = this.chapters.findIndex(chapter => chapter.getChapterID() === chapterID);
        if(index < 0)
            throw Error(`Chapter with ID ${chapterID} doesn't exist, can't delete it.`)

        const chapter = this.chapters[index]
        this.chapters.splice(index, 1);

        // Ask the database to update the new book metadata then delete the chapter.
        return this.requestSave().then(() => removeChapterFromEditionInFirestore(chapter));

    }

    getSymbols() { return this.specification.symbols; }

    hasReferences() { return this.specification.references && Object.keys(this.specification.references).length > 0; }
	getReferences() { return this.specification.references; }
    getReference(citationID: string) { return citationID in this.specification.references ? this.specification.references[citationID] : undefined; }
    addReferences(references: ReferenceNode[]) {
        // Generate a unique ID for the reference.
        references.forEach(ref => this.specification.references[ref.citationID] = ref.toList());
        return this.requestSave();
    }
    editReference(ref: ReferenceNode) {
        if(!(ref.citationID in this.specification.references)) return;
        this.specification.references[ref.citationID] = ref.toList();
        return this.requestSave();
    }
    editReferenceID(newCitationID: string, ref: ReferenceNode) {
        if(!(ref.citationID in this.specification.references)) return;
        delete this.specification.references[ref.citationID];
        this.specification.references[newCitationID] = ref.withCitationID(newCitationID).toList();
        return this.requestSave(); 
    }
    removeReference(citationID: string) {
        if(!(citationID in this.specification.references)) return;
        delete this.specification.references[citationID];
        return this.requestSave();
    }

    hasGlossary() { return this.specification.glossary && Object.keys(this.specification.glossary).length > 0 }
	getGlossary() { return this.specification.glossary }
    hasDefinition(id: string) { return id in this.specification.glossary; }
    addDefinition(id: string, phrase: string, definition: string, synonyms: string[]) {
        this.specification.glossary[id] = {
            phrase: phrase,
            definition: definition,
            synonyms: synonyms
        }
        return this.requestSave();
    }
    removeDefinition(id: string) {
        delete this.specification.glossary[id];
        return this.requestSave();
    }
    editDefinition(id: string, definition: Definition) {
        this.specification.glossary[id] = definition;
        return this.requestSave();
    }
    editDefinitionID(id: string, newID: string) {
        if(!(id in this.specification.glossary)) return;
        const definition = this.specification.glossary[id];
        delete this.specification.glossary[id];
        this.specification.glossary[newID] = definition;
        return this.requestSave();
    }

	getTags() { return this.specification.tags }

    getTheme() { return this.specification.theme; }
    setTheme(theme: Theme | null) {
        this.specification.theme = theme;
        return this.requestSave();
    }
    setThemeValue(group: string, name: string, value: string) {
        if((this.specification.theme as Record<string, Record<string, string>>)[group][name] === value) return;
        (this.specification.theme as Record<string, Record<string, string>>)[group][name] = value
        return this.requestSave();
    }

    // Don't let callers get their sneaky hands on this mutable array...
	getAuthors() { return [...this.specification.authors ]; }
    addAuthor(name: string) {
        this.specification.authors.push(name)
        return this.requestSave();
    }
    setAuthor(index: number, name: string) {
        if(index >= 0 && index < this.specification.authors.length)
            this.specification.authors[index] = name;

            return this.requestSave();
    }
    removeAuthor(index: number) {
        if(index >= 0 && index < this.specification.authors.length)
            this.specification.authors.splice(index, 1);
        return this.requestSave();
    }

	getRevisions() { return [...this.specification.revisions]; }

    hasImage(id: string) { return id in this.specification.images && this.specification.images[id] !== null; }
    getImage(id: string) { return this.specification.images[id] ?? null; }
    setImage(id: string, embed: string | null) {
        if(this.specification.images[id] === embed) return;
        this.specification.images[id] = embed ?? null;
        return this.requestSave();
    }
	
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
		return sourceID.charAt(0) === "#" && sourceID.substring(1) in this.specification.sources ? 
            this.specification.sources[sourceID.substring(1)] : 
            null;
	}

	getChapterName(chapterID: string): string | undefined { 
        const chapter = this.getChapter(chapterID);
        return chapter?.getTitle()
    }

    getChapterSection(chapterID: string): string | undefined { 
        const chapter = this.getChapter(chapterID);
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
                        bookIndex[word].add(chapter.getChapterID());
                    }
                });
		});

        return bookIndex;

	}

	// Given the current chapter, find the available chapter after it.
    getNextChapterID(chapterID: string) {

        // Handle back matter chapters.
        switch(chapterID) {
            case ChapterIDs.ReferencesID: return this.hasGlossary() ? ChapterIDs.GlossaryID : ChapterIDs.IndexID;
            case ChapterIDs.GlossaryID: return ChapterIDs.IndexID;
            case ChapterIDs.IndexID: return ChapterIDs.SearchID;
            case ChapterIDs.SearchID: return ChapterIDs.MediaID;
            case ChapterIDs.MediaID: return ChapterIDs.TableOfContentsID;
            case ChapterIDs.TableOfContentsID: return this.chapters.length > 0 ? this.chapters[0].getChapterID() : null;
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
                    return this.hasReferences() ? ChapterIDs.ReferencesID : this.hasGlossary() ? ChapterIDs.GlossaryID : ChapterIDs.IndexID;
                // Otherwise, it wasn't a valid ID
                else
                    return null;
        }

	}

	// Given a chapter id, find the available chapter before it.
	getPreviousChapterID(chapterID: string) {

        switch(chapterID) {

            // Handle back matter chapters.
            case ChapterIDs.ReferencesID: return this.chapters.length > 0 ? this.chapters[this.chapters.length - 1].getChapterID() : null; // Last chapter of the book
            case ChapterIDs.GlossaryID: return this.hasReferences() ? ChapterIDs.ReferencesID : this.chapters.length > 0 ? this.chapters[this.chapters.length - 1].getChapterID() : ChapterIDs.TableOfContentsID;
            case ChapterIDs.IndexID: return this.hasGlossary() ? ChapterIDs.GlossaryID : this.hasReferences() ? ChapterIDs.ReferencesID : this.chapters.length > 0 ? this.chapters[this.chapters.length - 1].getChapterID() : ChapterIDs.TableOfContentsID;
            case ChapterIDs.SearchID: return ChapterIDs.IndexID;
            case ChapterIDs.MediaID: return ChapterIDs.SearchID;
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
                    return ChapterIDs.TableOfContentsID;
                // Otherwise, it wasn't a valid ID
                else
                    return null;
        }

	}

    // Get all of the embeds in the book
    getEmbeds(): EmbedNode[] {

        let embeds: EmbedNode[] = [];

        // Add the book cover
        const cover = this.getImage("cover");
        if(cover) {
            let coverNode = Parser.parseEmbed(this, cover);
            if(coverNode instanceof EmbedNode)
                embeds.push(coverNode);
        }

        // Add the cover and images from each chapter.
		this.getChapters().forEach(c => {

            const image = c.getImage();
            let cover = image === null ? undefined : Parser.parseEmbed(this, image);
            if(cover && cover instanceof EmbedNode)
                embeds.push(cover);

            // Get the chapter body's embeds
            let bodyEmbeds = c?.getAST()?.getEmbeds();
            if(bodyEmbeds)
                bodyEmbeds.forEach((embed: EmbedNode) => embeds.push(embed))

        });

        // Add the back matter covers
        let backmatter = ["references", "glossary", "index", "search", "media"];
        backmatter.forEach(id => {
            const img = this.getImage(id)
            if(img) {
                let image = Parser.parseEmbed(this, img);
                if(image instanceof EmbedNode) 
                    embeds.push(image);
            }
        });

        return embeds;

    }

    isLatestPublishedEdition(): boolean {

        const latestEditionID = this.book?.getLatestPublishedEditionID()
        return latestEditionID !== undefined && latestEditionID === this.editionRef?.id;

    }

    /* Edition numbers are 1 to N */
    getEditionNumber() {
        const revisions = this.book?.getRevisions();
        if(revisions === undefined) return undefined;
        for(let i = 0; i < revisions.length; i++)
            if(revisions[i].ref.id === this.editionRef?.id) return revisions.length - i;
        return undefined;
    }

}