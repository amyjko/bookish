import { Parser } from "./Parser.js";
import { Chapter } from './Chapter.js';

class Book {

    static TableOfContentsID = "";
    static ReferencesID = "references";
    static SearchID = "search";
	static MediaID = "media";
    static IndexID = "index";
	static GlossaryID = "glossary";

    // Given an object with a valid specification and an object mapping chapter IDs to chapter text,
    // construct an object representing a book.
    constructor(specification, chapters) {

        if(typeof specification !== "object")
            throw Error("Expected a book specification object.")

        if(typeof chapters !== "object")
            throw Error("Expected an object mapping chapter IDs to chapter text")

        // If undefined, it's not loaded; if null, it failed to load; otherwise, an object with a book specification.
        this.specification = specification;

        // Create a list and dictionary of Chapter objects.
        this.chapters = []
        this.chaptersByID = {}
        this.specification.chapters.forEach(chapter => {
            this.chaptersByID[chapter.id] = new Chapter(
                this,
                chapter,
                chapter.forthcoming ? null : chapters[chapter.id]
            )
            this.chapters.push(this.chaptersByID[chapter.id])
        })

        // Lookup table for optimization
		this.chapterNumbers = {};

    }

    getTitle() { return this.specification.title; }
    getChapters() { return this.chapters }
    hasChapter(chapterID) { return chapterID in this.chaptersByID || ["references", "glossary", "index", "search", "media"].includes(chapterID); }
    getChapter(chapterID) { return this.hasChapter(chapterID) ? this.chaptersByID[chapterID] : null; }
    getSymbols() { return this.specification ? this.specification.symbols : {}; }
	getLicense() { return this.specification.license; }
    hasReferences() { return this.getReferences() !== undefined && Object.keys(this.getReferences()).length > 0; }
	getReferences() { return this.specification.references; }
    hasGlossary() { return this.getGlossary() !== undefined && Object.keys(this.getGlossary()).length > 0; }
	getGlossary() { return this.specification.glossary; }
	getTags() { return "tags" in this.specification ? this.specification.tags : []; }
	getAuthors() { return this.specification.authors; }	
	getAuthorByID(id) { return this.getAuthors().find(el => el.id === id); }
	getDescription() { return this.specification.description; }
	getAcknowledgements() { return this.specification.acknowledgements; }
	getRevisions() { return this.specification.revisions; }

    hasImage(id) { return id in this.specification.images; }
    getImage(id) { return this.hasImage(id) ? this.specification.images[id] : null; }

	
	getBookReadingTime() {
		return this.chapters
                .map(chapter => chapter.getReadingTime())
                .reduce((total, time) => time === undefined ? total : total + time, 0);
	}

	getChapterNumber(chapterID) {

		// If we haven't cached it yet, compute it.
		if(!(chapterID in this.chapterNumbers)) {
			let chapterNumber = 1;
			let match = null;
			this.chapters.forEach(chapter => {
				// If we found a match...
				if(chapter.getID() === chapterID) {
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
            if(match !== null) {
    			this.chapterNumbers[chapterID] = match;
                return match;
            }
            else return undefined;
            
		}
        else 
            // Return it.
            return this.chapterNumbers[chapterID];

	}

	getSource(sourceID) { 
		return sourceID.charAt(0) === "#" && sourceID.substring(1) in this.specification.sources ? 
            this.specification.sources[sourceID.substring(1)] : 
            null;
	}

	getChapterName(chapterID) { return this.hasChapter(chapterID) ? this.getChapter(chapterID).getTitle() : null; }

    getChapterSection(chapterID) { return this.hasChapter(chapterID) ? this.chaptersByID[chapterID].getSection() : null; }

	getFootnoteSymbol(number) {

		let symbols = "abcdefghijklmnopqrstuvwxyz";
        // Let's hope there are never more than 26^2 footnotes in a single chapter...
        return number < symbols.length ?
            symbols.charAt(number) :
            symbols.charAt(Math.floor(number / symbols.length) - 1) + symbols.charAt(number % symbols.length);

	}

    getBookIndex() {

		const bookIndex = {};

		// Construct the index by building a dictionary of chapters in which each word appears.
		this.chapters.forEach(chapter => {
            let index = chapter.getIndex();
            if(index)
			    Object.keys(index).forEach(word => {
                    if(word !== "" && word.length > 2) {
                        if(!(word in bookIndex))
                            bookIndex[word] = {};
                        bookIndex[word][chapter.id] = true;
                    }
                });
		});

		// Convert each word's dictionary to a list of chapter IDs for display.
		Object.keys(bookIndex).forEach(word => {
			bookIndex[word] = Object.keys(bookIndex[word]);
		});

		return this.cleanIndex(bookIndex);

	}

    cleanIndex(index) {

		// Remove any:
		// * upper case versions of words if they appear in lower case,
		// * plural versions of words if they appear in singular
		// as a heuristic for detecting non-proper nounds.
		const duplicates = [];
		Object.keys(index).forEach(word => {
			let duplicate = false;
			let canonical = null;
			if((word.charAt(0) === word.charAt(0).toUpperCase() && word.toLowerCase() in index)) {
				duplicate = true;
				canonical = word.toLowerCase();
			}
			if(word.charAt(word.length - 1) === "s" && word.toLowerCase().substring(0, word.length - 1) in index) {
				duplicate = true;
				canonical = word.toLowerCase().substring(0, word.length - 1);
			}
			if(duplicate) {				
				duplicates.push(word);
				// Merge any chapter occurrences, removing duplicates using a set and spread.
				if(Array.isArray(index[canonical]))
					index[canonical] = [...new Set(index[canonical].concat(index[word]))];
			}
		})
		duplicates.forEach(word => {
			delete index[word];
		});

		return index;

	}

	// Given the current chapter, find the available chapter after it.
    getNextChapterID(chapterID) {

        // Handle back matter chapters.
        switch(chapterID) {
            case Book.ReferencesID: return this.hasGlossary() ? Book.GlossaryID : Book.IndexID;
            case Book.GlossaryID: return Book.IndexID;
            case Book.IndexID: return Book.SearchID;
            case Book.SearchID: return Book.MediaID;
            case Book.MediaID: return Book.TableOfContentsID;
            default:
                let after = false;
                for(let i = 0; i < this.chapters.length; i++) {
                    let chapter = this.chapters[i];
                    if(chapter.getID() === chapterID)
                        after = true;
                    // If we're after the given chapter and it's not forthcoming.
                    else if(after && !chapter.isForthcoming())
                        return chapter.getID();
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
	getPreviousChapterID(chapterID) {

        switch(chapterID) {

            // Handle back matter chapters.
            case Book.ReferencesID: return this.chapters[this.chapters.length - 1].id; // Last chapter of the book
            case Book.GlossaryID: return this.hasReferences() ? Book.ReferencesID : this.chapters[this.chapters.length - 1].id;
            case Book.IndexID: return this.hasGlossary() ? Book.GlossaryID : this.hasReferences() ? Book.ReferencesID : this.chapters[chapters.length - 1].id;
            case Book.SearchID: return Book.IndexID;
            case Book.MediaID: return Book.SearchID;
            default:
                let before = false;
                for(let i = this.chapters.length - 1; i >= 0; i--) {
                    let chapter = this.chapters[i];
                    if(chapter.getID() === chapterID)
                        before = true;
                    // If we're before the given chapter and it's not forthcoming.
                    else if(before && !chapter.isForthcoming())
                        return chapter.getID();
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
    getMedia() {

        let media = [];
        let urls = new Set(); // This just prevents duplicates.

        // Add the book cover
        media.push(Parser.parseEmbed(this, this.getImage("cover")));

        // Add the cover and images from each chapter.
		this.getChapters().forEach(c => {

            let cover = c.getImage() === null ? null : Parser.parseEmbed(this, c.getImage());
            if(cover && !urls.has(cover.url)) {
                media.push(cover);
                urls.add(cover.url);
            }

            let embeds = c?.getAST()?.getEmbeds();
            if(embeds)
                embeds.forEach(embed => {
                    if(!urls.has(embed.url)) {
                        media.push(embed);
                        urls.add(embed.url);
                    }
                })

        });

        // Add the back matter covers
        let backmatter = ["references", "glossary", "index", "search", "media"];
        backmatter.forEach(id => {
            if(this.hasImage(id)) {
                let image = Parser.parseEmbed(this, this.getImage(id));
                if(!urls.has(image.url)) {
                    media.push(image);
                    urls.add(image.url);
                }    
            }
        });

        return media;

    }

}

export default Book