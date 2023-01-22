import type { DocumentReference } from 'firebase/firestore';
import BookMedia from './BookMedia';
import type Edition from './Edition';

/** A replication of edition info */
export type EditionInfo = {
    ref: DocumentReference;
    summary: string;
    number: number;
    published: number | null;
    editionuids: string[];
    chapteruids: string[];
};

export type BookSpecification = {
    // All of these are caches from the latest edition, saved when an edition is updated.
    title: string;
    authors: string[];
    description: string;
    cover: string | null;
    published: boolean;
    editions: EditionInfo[];
    // An optional subdomain, for use in URLs
    domain: string | null;
    // A list of user ids that have access to edit the book.
    uids: string[];
    // A derived list of user ids that have read level access to the book via edition or chapter level write access.
    readuids: string[];
};

export default class Book {
    readonly ref: DocumentReference;
    readonly title: string;
    readonly authors: string[];
    readonly description: string;
    readonly cover: string | null;
    readonly published: boolean;
    readonly editions: EditionInfo[];
    readonly domain: string | null;
    readonly uids: string[];

    media: BookMedia;

    constructor(
        ref: DocumentReference,
        title: string,
        authors: string[],
        description: string,
        cover: string | null,
        editions: EditionInfo[],
        domain: string | null,
        uids: string[]
    ) {
        this.ref = ref;
        this.title = title;
        this.authors = authors;
        this.description = description;
        this.cover = cover;
        // We always keep editions in reversed edition number for easy reference.
        this.published = editions.some((edition) => edition.published !== null);
        this.editions = editions.sort((a, b) => a.number - b.number);
        this.domain = domain;
        this.uids = uids;

        this.media = new BookMedia(this);
    }

    getMedia() {
        return this.media;
    }

    static fromJSON(ref: DocumentReference, book: BookSpecification): Book {
        return new Book(
            ref,
            book.title,
            book.authors,
            book.description,
            book.cover,
            book.editions,
            book.domain,
            book.uids
        );
    }

    toJSON() {
        const json: BookSpecification = {
            title: this.title,
            authors: this.authors,
            description: this.description,
            cover: this.cover,
            published: this.published,
            domain: this.domain,
            editions: this.editions,
            uids: this.uids,
            readuids: Array.from(
                new Set(
                    this.editions
                        .map((edition) => [
                            ...edition.editionuids,
                            ...edition.chapteruids,
                        ])
                        .flat()
                )
            ),
        };
        return json;
    }

    getSubdomain() {
        return this.domain;
    }

    withSubdomain(domain: string) {
        return new Book(
            this.ref,
            this.title,
            this.authors,
            this.description,
            this.cover,
            this.editions,
            domain.length === 0 ? null : domain,
            this.uids
        );
    }

    getTitle() {
        return this.title;
    }

    withTitle(title: string) {
        return new Book(
            this.ref,
            title,
            this.authors,
            this.description,
            this.cover,
            this.editions,
            this.domain,
            this.uids
        );
    }

    getDescription() {
        return this.description;
    }

    withDescription(description: string) {
        return new Book(
            this.ref,
            this.title,
            this.authors,
            description,
            this.cover,
            this.editions,
            this.domain,
            this.uids
        );
    }

    getCover() {
        return this.cover;
    }

    withCover(cover: string | null) {
        return new Book(
            this.ref,
            this.title,
            this.authors,
            this.description,
            cover,
            this.editions,
            this.domain,
            this.uids
        );
    }

    getAuthors() {
        return this.authors;
    }

    withAuthors(authors: string[]) {
        return new Book(
            this.ref,
            this.title,
            authors,
            this.description,
            this.cover,
            this.editions,
            this.domain,
            this.uids
        );
    }

    getRef() {
        return this.ref;
    }

    getRefID() {
        return this.ref.id;
    }

    getEditionNumberID(number: number) {
        // Get the ID corresponding to this number.
        const edition = this.editions.find((ed) => ed.number === number);
        return edition ? edition.ref.id : undefined;
    }

    getLatestPublishedEditionID() {
        return this.editions.filter((ed) => ed.published !== null)[0]?.ref.id;
    }

    getLatestEditionID(): string | undefined {
        return this.editions[0]?.ref.id;
    }

    getEditions() {
        return this.editions.slice();
    }

    getPublishedEditionCount() {
        return this.editions.filter((edition) => edition.published).length;
    }

    isEditor(uid: string) {
        return this.uids.includes(uid);
    }

    withEditors(uids: string[]) {
        return new Book(
            this.ref,
            this.title,
            this.authors,
            this.description,
            this.cover,
            this.editions,
            this.domain,
            uids
        );
    }

    withEditions(revisions: EditionInfo[]) {
        return new Book(
            this.ref,
            this.title,
            this.authors,
            this.description,
            this.cover,
            revisions,
            this.domain,
            this.uids
        );
    }

    withRevisedEdition(previous: Edition, revised: Edition) {
        // Get the new info.
        const info = revised.getInfo();
        if (info === undefined) return this;

        // If no previous addition, just add it.
        if (previous === undefined)
            return this.withEditions([...this.editions, info]);

        // Find the corresponding edition.
        const index = this.editions.findIndex(
            (edition) => edition.number === previous.number
        );

        return index < 0
            ? this
            : this.withEditions([
                  ...this.editions.slice(0, index),
                  info,
                  ...this.editions.slice(index + 1),
              ]);
    }

    hasPublishedEdition() {
        return this.editions.some((revision) => revision.published !== null);
    }
}
