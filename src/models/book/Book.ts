import { DocumentReference } from "firebase/firestore";
import { loadEditionFromFirestore, updateBookInFirestore } from "../Firestore";
import BookMedia from "./BookMedia";
import Edition, { BookSaveStatus } from "./Edition";

export type Revision = {
    ref: DocumentReference;
    time: number;
    summary: string;
    published: boolean;
}

export type BookSpecification = {
    // All of these are caches from the latest edition, saved when an edition is updated.
    title: string;
    authors: string[];
    description: string;
    cover: string | null;
    // A list of editions
    revisions: Revision[];
    // An optional subdomain
    domain?: string;
    // A list of user ids that have access to edit the book.
    uids: string[];
};

export default class Book {

    readonly ref: DocumentReference;
    readonly spec: BookSpecification;

    // A list of requested edits, stored as promises, resolved
    // when the book is ready to save.
    edits: { resolve: Function, reject: Function }[] = [];

    // The timer that checks for inactivity.
    timerID: NodeJS.Timer | undefined;
    lastEdit: number = 0;

    listeners: Set<Function> = new Set();

    media: BookMedia;

    constructor(ref: DocumentReference, spec: BookSpecification) {

        this.ref = ref;
        this.spec = spec;

        // Periodically check for inactivity, and then update the book.
        this.timerID = setInterval(() => {
            // If it's been more than a second since our last edit and there
            // are edits that haven't been saved, try updating the book, 
            // and if we succeed, resolve all of the edits, and if we fail,
            // then reject them.
            if(Date.now() - this.lastEdit > 1000 && this.edits.length > 0) {
                // Tell listeners that this book model changed.
                this.notifyListeners(BookSaveStatus.Saving);
                updateBookInFirestore(this)
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

        this.media = new BookMedia(this);

    }

    getMedia() { return this.media; }

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

    addListener(listener: (status: BookSaveStatus) => void) { this.listeners.add(listener); }
    removeListener(listener: Function) { this.listeners.delete(listener); }
    notifyListeners(status: BookSaveStatus) { this.listeners.forEach(listener => listener.call(undefined, status)); }

    toObject() { return this.spec; }

    getSubdomain() { return this.spec.domain; }
    setSubdomain(domain: string) { 
        if(domain.length === 0)
            delete this.spec.domain;
        else
            this.spec.domain = domain;
        return this.requestSave();
    }

    getTitle() { return this.spec.title; }
    setTitle(title: string) { 
        this.spec.title = title;
        return this.requestSave();
    }

    getDescription() { return this.spec.description; }
    setDescription(description: string) { 
        this.spec.description = description;
        return this.requestSave();
    }

    getCover() { return this.spec.cover; }
    setCover(cover: string | null) { 
        this.spec.cover = cover;
        return this.requestSave();
    }

    getAuthors() { return this.spec.authors; }
    setAuthors(authors: string[]) { 
        this.spec.authors = authors;
        return this.requestSave();
    }

    getRef() { return this.ref }
    getRefID() { return this.ref.id }

    getDraftEdition(): undefined | Promise<Edition> {
        return this.spec.revisions.length === 0 ? undefined : loadEditionFromFirestore(this, this.spec.revisions[0].ref.id);
    }

    /* Note: editions are numbered 1-n, but stored in reverse chronological order. */
    getEditionNumber(number: number) {
        return number < 1 || number > this.spec.revisions.length ? 
            undefined : 
            loadEditionFromFirestore(this, this.spec.revisions[this.spec.revisions.length - number].ref.id);
    }

    getLatestPublishedEdition(): undefined | Promise<Edition> {
        const latest = this.getLatestPublishedEditionID();
        return latest === undefined ? undefined : loadEditionFromFirestore(this, latest);
    }

    getLatestPublishedEditionID() {
        return this.spec.revisions.find(e => e.published)?.ref.id;
    }    

    getRevisions() { return this.spec.revisions.slice(); }
    setRevisions(revisions: Revision[]) {
        this.spec.revisions = revisions.slice();
        return this.requestSave();
    }

    setEditionChangeSummary(summary: string, index: number) {
        if(index >= 0 && index < this.spec.revisions.length) {
            this.spec.revisions[index].summary = summary;
            return this.requestSave();
        }
    }

    setPublished(published: boolean, revisionNumber: number) {
        if(revisionNumber >= 0 && revisionNumber < this.spec.revisions.length) {
            this.spec.revisions[revisionNumber].published = published;
            return this.requestSave();
        }
    }

    hasPublishedEdition() {
        return this.spec.revisions.find(revision => revision.published) !== undefined;
    }

    updateMetadataFromEdition(edition: Edition) {

        this.setTitle(edition.getTitle());
        this.setCover(edition.getImage("cover") ?? null);
        this.setAuthors(edition.getAuthors());
        this.setDescription(edition.getDescription());

    }

}